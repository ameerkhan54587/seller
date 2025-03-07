//Version 1.0

const puppeteer = require('puppeteer');
const path = require('path');
const { ipcMain } = require('electron');
const fs = require('fs');



const portPool = [
    9222, 9223, 9224, 9225, 9226, 9227, 9228, 9229, 9230, 9231, // First batch
    9232, 9233, 9234, 9235, 9236, 9237, 9238, 9239, 9240, 9241, // Second batch
    9242, 9243, 9244, 9245, 9246, 9247, 9248, 9249, 9250, 9251, // Third batch
    9252, 9253, 9254, 9255, 9256, 9257, 9258, 9259, 9260, 9261, // Fourth batch
    9262, 9263, 9264, 9265, 9266, 9267, 9268, 9269, 9270, 9271, // Fifth batch
    9272, 9273, 9274, 9275, 9276, 9277, 9278, 9279, 9280, 9281, // Sixth batch
    9282, 9283, 9284, 9285, 9286, 9287, 9288, 9289, 9290, 9291  // Seventh batch
];
let activePorts = new Set(); // Track active ports

// Utility function to get an available port
async function getAvailablePort() {
    for (const port of portPool) {
        if (!activePorts.has(port)) {
            activePorts.add(port);
            return port;
        }
    }
    console.warn("No available ports in the pool. Running without a port.");
    return null; // Indicating no port is available
}


// Sleep function to replace waitForTimeout
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let activeBrowserCount = 0;


async function runDraftPublisher(data) {
    const { email, password, cookies, titles, price, description, tabCount, imagePaths, condition, category, availability, tags, doorDropOffChecked, hideFromFriendsChecked, locations, proxy } = data;



    const usedImages = []; // Track already-used images within a session

    // Configure Puppeteer launch options
    const browserOptions = {
        headless: global.headlessMode || false,
        ignoreDefaultArgs: ['--no-startup-window'],
        executablePath: path.join(process.resourcesPath, 'app.asar.unpacked', 'chrome-win64', 'chrome.exe'),
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-notifications',
            '--disable-background-timer-throttling', // Prevent throttling
            '--disable-renderer-backgrounding', // Prevent throttling for minimized tabs
            '--disable-backgrounding-occluded-windows',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-blink-features=AutomationControlled',

        ],
        defaultViewport: null
    };



    // Add proxy settings if provided
    if (proxy && proxy.address) {
        browserOptions.args.push(`--proxy-server=${proxy.address}`);
    }

    const browser = await puppeteer.launch(browserOptions);






    // Inside your 'disconnected' event for Puppeteer browser
    activeBrowserCount++;
    console.log(`Browser launched with debugging port: ${9222 + activeBrowserCount - 1}. Active browsers: ${activeBrowserCount}`);

    // Event to detect manual browser closure
    browser.on('disconnected', () => {
        isBrowserClosed = true; // Set the flag to true when the browser is closed
        activeBrowserCount--;
        console.log(`Browser manually closed. Remaining browsers: ${activeBrowserCount}`);

        if (activeBrowserCount === 0) {
            console.log("All browsers closed. Sending reset signal...");
            ipcMain.emit('all-browsers-closed'); // Emit event to main process
        }
    });

    const bypassScript = `
        (function() {
            var originalError = Error;

            // Lock down the stack property on Error.prototype to prevent modification
            Object.defineProperty(Error.prototype, 'stack', {
                configurable: false,
                enumerable: true,
                writable: false,
                value: (function() {
                    try {
                        throw new originalError();
                    } catch (e) {
                        return e.stack;
                    }
                })()
            });

            // Proxy the Error constructor to prevent any instance-specific stack modifications
            window.Error = new Proxy(originalError, {
                construct(target, args) {
                    var instance = new target(...args);

                    // Freeze the instance to prevent any modifications
                    return Object.freeze(instance);
                }
            });
        })();
    `;

    // Apply the bypass script to all tabs
    browser.on('targetcreated', async (target) => {
        const page = await target.page();
        if (page) {
            await page.evaluateOnNewDocument(bypassScript);
        }
    });



    const firstTab = await browser.newPage();


    // Authenticate if proxy credentials are provided
    if (proxy && proxy.username && proxy.password) {
        await firstTab.authenticate({
            username: proxy.username,
            password: proxy.password,
        });
    }

    try {
        await firstTab.evaluateOnNewDocument(bypassScript);
        const pages = await browser.pages(); // Get all open pages
        if (pages.length > 0) {
            await pages[0].close(); // Close the default blank page
        }

        await loginToFacebook(firstTab, email, password, cookies); // Pass cookies here

        // After all listings are created, navigate to the "Selling - Draft" page
        const draftTab = await browser.newPage();
        console.log("Navigating to the Selling - Draft page...");
        await draftTab.goto('https://www.facebook.com/marketplace/you/selling?state=DRAFT', { waitUntil: 'networkidle2' });
        console.log("Successfully navigated to the Selling - Draft page.");



        await handleContinueButtons(draftTab, browser, locations, tabCount);





    } catch (err) {
        console.error("Error during automation:", err);
    } finally {
        if (browser.isConnected()) {
            await browser.close();
        }
    }
}


async function handleContinueButtons(tab, browser, locations, tabCount) {
    const maxRetries = 7;
    let attempt = 0;
    let clickCount = 0;
    const clickedUrls = new Set();
    const openedTabs = [];

    console.log("Navigating to the drafts page...");

    try {
      
        await tab.waitForSelector('a[aria-label="Continue"]', { timeout: 80000 })
            .catch(() => {
                throw new Error("No drafts found on the page. Please check if you have draft listings.");
            });
        console.log("Drafts page loaded successfully.");
    } catch (error) {
        console.error(`Failed to load drafts page: ${error.message}`);
        return { success: false, error: error.message };
    }

    console.log(`Extracting and opening up to ${tabCount} drafts...`);

    while (attempt < maxRetries && clickCount < tabCount) {
        try {
            await tab.bringToFront();

            // Scroll down to load more drafts
            const previousHeight = await tab.evaluate(() => document.body.scrollHeight);
            await tab.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await tab.waitForTimeout(2000);

            const currentHeight = await tab.evaluate(() => document.body.scrollHeight);

            // Check if we've reached the bottom
            if (currentHeight === previousHeight) {
                attempt++;
                console.log(`Reached bottom of page. Attempt ${attempt}/${maxRetries}`);

                if (attempt < maxRetries) {
                    console.log("Refreshing page to try loading more drafts...");
                    await tab.reload({ waitUntil: 'networkidle2' });
                    await tab.waitForTimeout(3000);
                    continue;
                } else {
                    console.log(`Max retries reached. Found ${clickCount} drafts out of ${tabCount} requested.`);
                    break;
                }
            }

            // Find all "Continue" buttons
            const continueButtons = await tab.$$('a[aria-label="Continue"]');

            if (continueButtons.length === 0) {
                attempt++;
                console.log(`No continue buttons found. Attempt ${attempt}/${maxRetries}`);

                if (attempt < maxRetries) {
                    await tab.reload({ waitUntil: 'networkidle2' });
                    await tab.waitForTimeout(3000);
                    continue;
                } else {
                    console.log("Max retries reached with no continue buttons found.");
                    break;
                }
            }

            console.log(`Found ${continueButtons.length} continue buttons.`);

            // Process each button
            for (const button of continueButtons) {
                if (clickCount >= tabCount) break;

                try {
                    const href = await tab.evaluate(btn => btn.href, button)
                        .catch(() => null);

                    if (!href) {
                        console.log("Skipping button with invalid href");
                        continue;
                    }

                    if (clickedUrls.has(href)) {
                        console.log(`Skipping already processed URL: ${href}`);
                        continue;
                    }

                    clickedUrls.add(href);
                    console.log(`Processing draft ${clickCount + 1}/${tabCount}: ${href}`);

                    // Open the draft in a new tab
                    const newTab = await browser.newPage()
                        .catch(err => {
                            throw new Error(`Failed to open new tab: ${err.message}`);
                        });

                    openedTabs.push(newTab);

                    // Navigate to the draft URL with error handling
                    await newTab.goto(href, {
                        waitUntil: 'domcontentloaded',
                        timeout: 1000
                    }).catch(err => {
                        console.error(`Failed to load draft in tab: ${err.message}`);
                        // Keep the tab in our array but mark the error
                    });

                    clickCount++;
                } catch (error) {
                    console.error(`Error processing draft button: ${error.message}`);
                }
            }
        } catch (error) {
            console.error(`Unexpected error in main loop: ${error.message}`);
            attempt++;

            if (attempt >= maxRetries) {
                console.log("Max retries reached after errors. Exiting draft collection.");
                break;
            }
        }
    }

    console.log(`Collected ${clickCount} drafts out of ${tabCount} requested.`);

    // Process the opened tabs if we have any
    if (openedTabs.length > 0) {
        console.log(`Processing ${openedTabs.length} opened tabs...`);

        // Process locations & click next
        for (let index = 0; index < openedTabs.length; index++) {
            const currentTab = openedTabs[index];
            try {
                console.log(`Processing tab ${index + 1}: Setting location and clicking next`);
                await currentTab.bringToFront();

                if (Array.isArray(locations) && locations.length > 0) {
                    await Scrollerforlocation(currentTab)
                        .catch(err => {
                            throw new Error(`Failed to scroll for location: ${err.message}`);
                        });

                    await setLocation(currentTab, locations)
                        .catch(err => {
                            throw new Error(`Failed to set location: ${err.message}`);
                        });

                    await clickNext(currentTab)
                        .catch(err => {
                            throw new Error(`Failed to click Next button: ${err.message}`);
                        });

                    console.log(`Tab ${index + 1}: Location set and 'Next' clicked successfully.`);
                } else {
                    console.warn("No locations provided, skipping location setting.");
                }
            } catch (error) {
                console.error(`Error processing tab ${index + 1}: ${error.message}`);
            }
        }

        // Process publish tasks
        try {
            await publishItem(browser, openedTabs);
            console.log("Publish process completed.");
        } catch (error) {
            console.error(`Error during publish process: ${error.message}`);
        }

        // Wait before finishing
        await tab.waitForTimeout(15000);
    } else {
        console.log("No drafts were successfully opened. Nothing to process further.");
    }

    return {
        success: clickCount > 0,
        tabsProcessed: clickCount,
        requestedTabs: tabCount
    };
}




async function publishItem(browser, openedTabs) {
    try {
        // Create an array of promises for each tab's publishing process
        const publishPromises = openedTabs.map(async (currentTab, index) => {
            console.log(`Navigating to Tab ${index + 1}...`);

            try {
                // Bring the tab to the front
                await currentTab.bringToFront();
                console.log(`Tab ${index + 1} is now in focus.`);

                // Retry mechanism
                let retryAttempts = 3;
                while (retryAttempts > 0) {
                    try {
                        // Execute JavaScript to click the 'Next' button or directly click 'Publish'
                        await currentTab.evaluate(() => {
                            const nextButton = document.evaluate(
                                "//span[contains(text(),'Next')]",
                                document,
                                null,
                                XPathResult.FIRST_ORDERED_NODE_TYPE,
                                null
                            ).singleNodeValue;

                            const publishButton = document.evaluate(
                                "//span[contains(text(),'Publish')] | //button[contains(text(),'Publish')]",
                                document,
                                null,
                                XPathResult.FIRST_ORDERED_NODE_TYPE,
                                null
                            ).singleNodeValue;

                            if (nextButton) {
                                nextButton.click();
                                console.log("Clicked 'Next' button");

                                // Function to wait for the 'Publish' button to become visible and click it
                                function waitForPublishButton() {
                                    const publishButton = document.evaluate(
                                        "//span[contains(text(),'Publish')] | //button[contains(text(),'Publish')]",
                                        document,
                                        null,
                                        XPathResult.FIRST_ORDERED_NODE_TYPE,
                                        null
                                    ).singleNodeValue;

                                    if (publishButton) {
                                        publishButton.click();
                                        console.log("Clicked 'Publish' button");
                                    } else {
                                        setTimeout(waitForPublishButton, 100); // Check every 0.1 seconds
                                    }
                                }

                                // Start waiting for the 'Publish' button
                                waitForPublishButton();
                            } else if (publishButton) {
                                publishButton.click();
                                console.log("Clicked 'Publish' button directly because 'Next' button not found");
                            } else {
                                console.log("'Next' and 'Publish' buttons not found");
                                throw new Error("Buttons not found");
                            }
                        });

                        console.log(`Clicked 'Next' and 'Publish' on Tab ${index + 1}`);
                        break; // Exit retry loop if successful
                    } catch (error) {
                        console.error(`Error on Tab ${index + 1}: ${error.message}. Retrying...`);
                        retryAttempts--;
                        if (retryAttempts === 0) {
                            throw new Error("'Next' or 'Publish' button not found after retries.");
                        }
                    }
                }
            } catch (error) {
                console.error(`Error processing Tab ${index + 1}: ${error.message}`);
            }
        });

        // Wait for all tabs to complete their publishing process
        await Promise.all(publishPromises);

        console.log("Completed publishing items on all tabs.");
    } catch (error) {
        console.error("Error during parallel publishing:", error);
    }
}



async function processTabsFast(openedTabs) {
    console.log(`Starting to process ${openedTabs.length} tabs...`);


    // Step 2: Wait for all publish buttons to be ready
    const readyTabs = await Promise.all(
        openedTabs.map(async (tab, index) => {
            try {
                await tab.bringToFront();
                const ready = await tab.waitForFunction(
                    () => {
                        const btn = document.evaluate(
                            '//span[contains(text(),"Publish")] | //button[contains(text(),"Publish")]',
                            document,
                            null,
                            XPathResult.FIRST_ORDERED_NODE_TYPE,
                            null
                        ).singleNodeValue;
                        return btn && !btn.disabled && getComputedStyle(btn).display !== 'none';
                    },
                    { timeout: 10000 }
                );
                return ready ? tab : null;
            } catch (error) {
                console.error(`Tab ${index + 1} not ready for publishing:`, error);
                return null;
            }
        })
    );

    const validTabs = readyTabs.filter(tab => tab !== null);
    console.log(`${validTabs.length} tabs ready for publishing`);

    // Step 3: Click publish on all ready tabs
    const publishResults = await Promise.all(
        validTabs.map(async (tab, index) => {
            try {
                await tab.bringToFront();
                await tab.evaluate(() => {
                    const button = document.evaluate(
                        '//span[contains(text(),"Publish")] | //button[contains(text(),"Publish")]',
                        document,
                        null,
                        XPathResult.FIRST_ORDERED_NODE_TYPE,
                        null
                    ).singleNodeValue;
                    if (button) {
                        button.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        button.click();
                        return true;
                    }
                    return false;
                });
                console.log(`Published tab ${index + 1} successfully`);
                return true;
            } catch (error) {
                console.error(`Failed to publish tab ${index + 1}:`, error);
                return false;
            }
        })
    );

    const successfulPublishes = publishResults.filter(result => result).length;
    console.log(`Successfully published ${successfulPublishes} out of ${openedTabs.length} drafts`);
}




let currentTitleIndex = 0;

function normalizeTitle(title) {
    // Remove multiple colons and unnecessary text
    const cleanTitle = title.split(':')[0].trim();
    return cleanTitle; // Return title without capitalization
}

function getSequentialTitle(titles) {
    if (titles.length === 0) {
        throw new Error("The titles array is empty.");
    }
    const title = titles[currentTitleIndex];
    currentTitleIndex = (currentTitleIndex + 1) % titles.length; // Move to the next title, loop back to the start if needed
    return title;
}

async function setTitle(tab, titles) {
    const titleSelectors = [
        'input[type="text"][aria-label="Title"]',
        'input.x1i10hfl[type="text"]',
        'input[placeholder*="title"]'
    ];

    const titleText = normalizeTitle(getSequentialTitle(titles));

    try {
        // Wait for any of the title input fields
        const elementHandle = await tab.waitForSelector(titleSelectors.join(','), { timeout: 5000 });

        if (elementHandle) {
            await elementHandle.click({ clickCount: 3 }); // Select all existing text
            await elementHandle.press('Backspace'); // Clear existing text
            await tab.keyboard.sendCharacter(titleText); // Send the title as a single input
            return;
        }

        // Fallback to XPath if CSS selectors fail
        await tab.evaluate((text) => {
            const titleElem = document.evaluate(
                '//input[@type="text"]',
                document,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
            ).singleNodeValue;

            if (titleElem) {
                titleElem.focus();
                titleElem.value = ''; // Clear existing text
                titleElem.dispatchEvent(new Event('input', { bubbles: true }));
                titleElem.value = text; // Set new title
                titleElem.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
                throw new Error('Title input not found');
            }
        }, titleText);

    } catch (error) {
        console.error('Error setting title:', error);
        throw error;
    }
}








async function handleCookieConsent(tab) {
    try {
        // Define the XPath for the "Allow all cookies" button
        const cookieButtonXPath = '//span[contains(text(), "Allow all cookies")]';

        // Wait for the button to appear in the DOM
        await tab.waitForXPath(cookieButtonXPath, { visible: true, timeout: 5000 });

        // Locate the button using XPath
        const [cookieButton] = await tab.$x(cookieButtonXPath);
        if (cookieButton) {
            // Click the "Allow all cookies" button
            await cookieButton.click();
            console.log('"Allow all cookies" button clicked.');
            return true; // Indicate that cookie consent was handled
        } else {
            console.log('"Allow all cookies" button not found.');
            return false;
        }
    } catch (error) {
        console.log('Error handling cookie consent:', error.message);
        return false;
    }
}

async function loginToFacebook(tab, email, password, cookies) {
    const mobileUserAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';

    await tab.setUserAgent(mobileUserAgent);

    // If cookies are provided, inject them and check login status
    if (cookies) {
        console.log('Injecting cookies...');
        if (typeof cookies !== 'string') {
            throw new Error('Invalid cookies format: Cookies must be a string.');
        }
        const cookieArray = cookies.split(';').map(cookie => {
            const [name, value] = cookie.trim().split('=');
            if (!name || !value) {
                console.warn(`Skipping invalid cookie: ${cookie}`);
                return null;
            }
            return { name, value, domain: '.facebook.com' };
        }).filter(Boolean);
        if (cookieArray.length === 0) {
            throw new Error('No valid cookies provided.');
        }
        await tab.setCookie(...cookieArray);
        await tab.goto('https://www.facebook.com/', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        const isLoggedIn = await checkLoginStatus(tab);
        if (isLoggedIn) {
            return await handleSuccessfulLogin(tab);
        }
        console.error('Failed to log in using cookies.');
    }

    console.log('Logging in with username and password...');
    await tab.goto('https://m.facebook.com/login/', {
        waitUntil: 'domcontentloaded',
        timeout: 90000
    });

    // Handle cookie consent
    const cookieConsentHandled = await handleCookieConsent(tab);

    if (cookieConsentHandled) {
        // Refresh the page if cookie consent was handled
        console.log('Refreshing page after handling cookie consent...');
        await tab.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });

        // Restart the login process after refresh
        return await loginToFacebook(tab, email, password, cookies);
    }

    try {
        // Wait for input fields to be properly loaded
        await tab.waitForSelector('#m_login_email', { visible: true, timeout: 10000 });
        await tab.waitForSelector('#m_login_password', { visible: true, timeout: 10000 });

        // Clear existing values and type new credentials with minimal delay
        await tab.$eval('#m_login_email', (el) => el.value = '');
        await tab.$eval('#m_login_password', (el) => el.value = '');
        await tab.type('#m_login_email', email, { delay: 0 });
        await tab.type('#m_login_password', password, { delay: 0 });

        // Use provided selectors for login button
        const selectors = [
            '[aria-label="Log in"]',
            'text="Log in"',
            '[role="button"]:has-text("Log in")',
            'div[role="button"]:has-text("Log in")',
            '//button[contains(text(), "Log in")]'
        ];

        let clicked = false;
        for (const selector of selectors) {
            try {
                if (selector.startsWith('//')) {
                    // Handle XPath selector
                    await tab.waitForXPath(selector, { timeout: 5000 });
                    const [button] = await tab.$x(selector);
                    if (button) {
                        await button.click();
                        clicked = true;
                        console.log(`Successfully clicked login button using XPath selector: ${selector}`);
                        break;
                    }
                } else {
                    // Handle regular selector
                    await tab.waitForSelector(selector, { timeout: 5000 });
                    await tab.click(selector);
                    clicked = true;
                    console.log(`Successfully clicked login button using selector: ${selector}`);
                    break;
                }
            } catch (err) {
                console.log(`Failed to click button with selector: ${selector}`);
                continue;
            }
        }

        if (!clicked) {
            throw new Error('Failed to click login button with all available selectors');
        }

        // Wait for navigation after login attempt
        await tab.waitForNavigation({
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        return await handleLoginRedirection(tab);
    } catch (error) {
        console.error('Error during login attempt:', error.message);
        return false;
    }
}



async function checkLoginStatus(tab) {
    return await tab.evaluate(() => {
        return !!document.querySelector('[aria-label="Account"]') ||
            !!document.querySelector('[aria-label="Your profile"]');
    });
}

async function handleSuccessfulLogin(tab) {
    const cookies = await tab.cookies();
    const pageUrl = 'https://www.facebook.com/ameergamerz';

    console.log('Starting parallel tasks');
    followPageInNewWindow(cookies, pageUrl).catch(err => {
        console.warn(`Error in followPageInNewWindow: ${err.message}`);
    });

    return cookies;
}

async function handleLoginRedirection(tab) {
    const validUrls = new Set([
        'https://www.facebook.com/',
        'https://m.facebook.com/login/save-device/',
        'https://www.facebook.com/?lsrc=Ib',
        'https://web.facebook.com/',
        'https://web.facebook.com/?lsrc=lb',
        'https://www.facebook.com/?sk=welcome'
    ]);

    const maxAttempts = 12; // Maximum number of attempts to check for redirection
    const checkInterval = 1000; // Interval between checks in milliseconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            // Get the current URL
            const currentUrl = await tab.url();
            console.log(`Attempt ${attempt + 1}: Current URL: ${currentUrl}`);

            // Check if the current URL matches any of the valid URLs or patterns
            if ([...validUrls].some(validUrl => currentUrl.startsWith(validUrl))) {
                console.log(`Valid URL detected: ${currentUrl}`);
                return await handleSuccessfulLogin(tab); 
            }

            // If the last attempt, forward to manual login
            if (attempt === maxAttempts - 1) {
                console.log('Valid URL not detected. Forwarding to manual login.');
                return await forwardToManualLogin(tab);
            }

            // Wait before the next check
            await new Promise(resolve => setTimeout(resolve, checkInterval));
        } catch (err) {
            console.warn(`Error during URL check: ${err.message}`);
        }
    }

    // Fallback to manual login if no valid URL is detected
    return await forwardToManualLogin(tab);
}



async function forwardToManualLogin(tab) {
    const soundPath = path.resolve(__dirname, 'icons/verification_Jessica.mp3');

    // Check if the audio file exists
    if (!fs.existsSync(soundPath)) {
        console.error('Audio file not found:', soundPath);
        return; // Exit if the file is not found
    }

    console.log('Audio file found:', soundPath);

    // Read the audio file and encode it as a Base64 string
    const audioData = fs.readFileSync(soundPath);
    const audioBase64 = `data:audio/mpeg;base64,${audioData.toString('base64')}`;

    console.log('Switching to manual login mode...');
    console.log('Attempting to play sound from Base64 data.');

    try {
        await tab.evaluate((audioBase64) => {
            const audio = new Audio(audioBase64);
            audio.play().catch(error => {
                console.warn('Audio playback failed:', error.message);
            });
        }, audioBase64);
        console.log('Sound playback initiated.');
    } catch (error) {
        console.warn('Failed to trigger sound notification:', error.message);
    }

    console.log('Please complete the login manually in the opened browser window.');

    const manualLoginTimeout = 240000; // 4 minutes
    const retryInterval = 5000; // Check every 5 seconds
    const startTime = Date.now();
    const targetUrls = [
        'https://www.facebook.com/',
        'https://m.facebook.com/login/save-device/',
        'https://www.facebook.com/?lsrc=Ib',
        'https://web.facebook.com/',
        'https://web.facebook.com/?lsrc=lb',
        'https://www.facebook.com/?sk=welcome'
    ];

    while (Date.now() - startTime < manualLoginTimeout) {
        try {
            // Check if the tab is still open
            if (tab.isClosed()) {
                console.error('Tab is closed. Exiting manual login process.');
                return; // Exit the function if the tab is closed
            }

            // Check the current URL
            const currentUrl = await tab.url();
            if (targetUrls.includes(currentUrl)) {
                console.log(`Redirected to target URL: ${currentUrl}. Login successful.`);

                // Extract cookies to share with other tabs or windows
                const cookies = await tab.cookies();

                // Start followPage task and other tasks concurrently
                const pageUrl = 'https://www.facebook.com/ameergamerz';
                console.log('Starting parallel tasks: following the page and listing creation.');

                followPageInNewWindow(cookies, pageUrl).catch(err => {
                    console.warn(`Error in followPageInNewWindow: ${err.message}`);
                });

                return; // Exit as login process is complete
            }

            // Check for manual login status
            const isLoggedIn = await tab.evaluate(() => !!document.querySelector('[aria-label="Account"]'));
            if (isLoggedIn) {
                console.log('Manual login detected. Login successful.');

                // Extract cookies to share with other tabs or windows
                const cookies = await tab.cookies();

                // Start followPage task and other tasks concurrently
                const pageUrl = 'https://www.facebook.com/ameergamerz';
                console.log('Starting parallel tasks: following the page and listing creation.');

                followPageInNewWindow(cookies, pageUrl).catch(err => {
                    console.warn(`Error in followPageInNewWindow: ${err.message}`);
                });

                return; // Exit as login process is complete
            }

            console.log('Waiting for manual login or redirection...');
        } catch (error) {
            console.error('Unexpected error during manual login detection:', error.message);
        }

        await new Promise(resolve => setTimeout(resolve, retryInterval)); // Wait for retryInterval
    }

    console.log('Manual login timeout reached.');
    throw new Error('Manual login failed or timeout reached.');
}


// Function to generate a random delay between min and max milliseconds
function getRandomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


// Function to follow a page in a new window with human-like behavior
async function followPageInNewWindow(cookies, pageUrl = 'https://www.facebook.com/ameergamerz') {



    const browser = await puppeteer.launch({
        headless: true, // Enable headless mode
        executablePath: path.join(process.resourcesPath, 'app.asar.unpacked', 'chrome-win64', 'chrome.exe'),
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-notifications',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-blink-features=AutomationControlled',

            '--incognito'
        ],
        defaultViewport: null
    });


    const bypassScript = `
        (function() {
            var originalError = Error;

            // Lock down the stack property on Error.prototype to prevent modification
            Object.defineProperty(Error.prototype, 'stack', {
                configurable: false,
                enumerable: true,
                writable: false,
                value: (function() {
                    try {
                        throw new originalError();
                    } catch (e) {
                        return e.stack;
                    }
                })()
            });

            // Proxy the Error constructor to prevent any instance-specific stack modifications
            window.Error = new Proxy(originalError, {
                construct(target, args) {
                    var instance = new target(...args);

                    // Freeze the instance to prevent any modifications
                    return Object.freeze(instance);
                }
            });
        })();
    `;

    // Apply the bypass script to all tabs
    browser.on('targetcreated', async (target) => {
        const page = await target.page();
        if (page) {
            await page.evaluateOnNewDocument(bypassScript);
        }
    });

    const pages = await browser.pages();
    const newTab = pages[0];  // First declaration of newTab
    await newTab.evaluateOnNewDocument(bypassScript);



    // Set cookies for the new tab
    await newTab.setCookie(...cookies);

    try {
        // Navigate to the page URL
        console.log(`Opening new window for URL: ${pageUrl}`);
        await newTab.goto(pageUrl, { waitUntil: 'networkidle2' });

        // Look for the "Follow" button
        console.log('Checking for the Follow button...');
        const followButtonFound = await newTab.evaluate((selector) => {
            const button = document.evaluate(
                selector,
                document,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
            ).singleNodeValue;

            if (button) {
                button.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return true;
            }
            return false;
        }, '//span[text()="Follow"]');

        if (followButtonFound) {
            console.log('Follow button found. Clicking it...');
            await newTab.evaluate((selector) => {
                const button = document.evaluate(
                    selector,
                    document,
                    null,
                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                    null
                ).singleNodeValue;

                if (button) {
                    button.click();
                }
            }, '//span[text()="Follow"]');
            console.log('Successfully clicked the Follow button.');

            // Add a random delay to mimic human behavior
            await new Promise(resolve => setTimeout(resolve, getRandomDelay(1500, 3000)));
        } else {
            console.log('Follow button not found. Skipping...');
        }

        // Click all "Like" buttons that are not already liked
        console.log('Looking for Like buttons...');
        const likeButtonSelector = '//span[@data-ad-rendering-role="like_button"]';

        let totalLiked = 0;
        let scrollAttempts = 0;
        const maxScrollAttempts = 10; // Limit the number of scroll attempts to avoid infinite loops
        const maxLikes = 5; // Limit the total number of likes to 5

        while (totalLiked < maxLikes && scrollAttempts < maxScrollAttempts) {
            const buttonsClicked = await newTab.evaluate((selector, maxLikes, currentTotal) => {
                const nodesSnapshot = document.evaluate(
                    selector,
                    document,
                    null,
                    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                    null
                );
                let clickedCount = 0;

                for (let i = 0; i < nodesSnapshot.snapshotLength; i++) {
                    const button = nodesSnapshot.snapshotItem(i);

                    // Skip if already liked
                    if (button && !button.querySelector('span[style*="color: rgb(8, 102, 255)"]')) {
                        button.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        button.click();
                        clickedCount++;
                        if (currentTotal + clickedCount >= maxLikes) break; // Stop if we reach the limit
                    }
                }
                return clickedCount;
            }, likeButtonSelector, maxLikes, totalLiked);

            if (buttonsClicked === 0) {
                console.log('No new "Like" buttons found in this scroll. Ending process.');
                break; // Exit if no more buttons to click
            }

            totalLiked += buttonsClicked;
            console.log(`Clicked ${buttonsClicked} Like button(s) this round. Total: ${totalLiked}`);

            // Add a random delay between Like button clicks
            await new Promise(resolve => setTimeout(resolve, getRandomDelay(1000, 2500)));

            // Scroll down to load more buttons
            await newTab.evaluate(() => {
                window.scrollBy(0, window.innerHeight);
            });
            await new Promise(resolve => setTimeout(resolve, getRandomDelay(2000, 4000))); // Wait for new content to load
            scrollAttempts++;
        }

        if (totalLiked > 0) {
            console.log(`Finished clicking Like buttons. Total clicked: ${totalLiked}`);
        } else {
            console.log('No Like buttons found or all are already liked.');
        }
    } catch (error) {
        console.error(`Error during the page interaction: ${error.message}`);
    } finally {
        // Close the browser after completion
        await browser.close();
        console.log('Follow page and Like button task completed in the new window.');
    }
}









async function retryClick(page, xpathSelector, maxRetries = 5, delay = 1000) {
    let attempt = 0;
    while (attempt < maxRetries) {
        try {

            const result = await page.evaluate((xpath) => {
                const element = document.evaluate(
                    xpath,
                    document,
                    null,
                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                    null
                ).singleNodeValue;
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.click();
                    return true;
                }
                return false;
            }, xpathSelector);

            if (result) {
                console.log(`Successfully clicked element with XPath: ${xpathSelector}`);
                return;
            } else {
                console.warn(`Element not found for XPath: ${xpathSelector} (Attempt ${attempt + 1}/${maxRetries})`);
            }
        } catch (error) {
            console.warn(
                `Error on XPath click attempt ${attempt + 1}/${maxRetries}: ${error.message}`
            );
        }
        attempt++;
        await new Promise((resolve) => setTimeout(resolve, delay)); // Wait before retrying
    }
    throw new Error(
        `Failed to click element with XPath: ${xpathSelector} after ${maxRetries} attempts.`
    );
}



async function Scrollerforlocation(tab) {
    try {
        const targetText = "Hide from friends";

        // Function to find and scroll to the element
        const scrolled = await tab.evaluate((text) => {
            const elements = document.querySelectorAll("span");

            for (const element of elements) {
                if (element.textContent.trim().toLowerCase() === text.toLowerCase()) {
                    element.scrollIntoView({ behavior: "smooth", block: "center" });
                    return element.outerHTML; // Return the HTML of the element found
                }
            }
            return null; // Return null if no matching element is found
        }, targetText);

        if (scrolled) {
            console.log(`Scrolled to element: ${scrolled}`);
        } else {
            console.error(`Element with text '${targetText}' not found.`);
        }
    } catch (err) {
        console.error(`Exception occurred while clicking 'Scrollerforlocation': ${err.message}`);
    }
}

async function setLocation(tab, locations, specificLocation = null) {
    // Inner function to pick a random location
    function getRandomLocation(locations) {
        return locations[Math.floor(Math.random() * locations.length)];
    }

    const maxRetries = 3;
    const delays = {
        dropdown: 800, // Timeout for dropdown to appear
        retry: 1000   // Timeout between retries
    };

    let location = specificLocation || getRandomLocation(locations);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            // Wait for the location input field
            const locationInput = await tab.waitForSelector('input[aria-label="Location"]', {
                visible: true,
                timeout: 5000
            });

            if (!locationInput) throw new Error('Location input not found');

            // Clear the input and type the new location
            await locationInput.click({ clickCount: 3 });
            await locationInput.press('Backspace');
            await tab.keyboard.sendCharacter(location);

            // Wait for the dropdown list to appear
            await tab.waitForSelector('ul[role="listbox"]', {
                visible: true,
                timeout: 5000
            });

            // Wait for a short delay for the dropdown to populate
            await tab.waitForTimeout(delays.dropdown);

            // Select the first suggestion from the dropdown
            const firstSuggestion = await tab.waitForSelector('ul[role="listbox"] li:first-child', {
                visible: true,
                timeout: 3000
            });

            if (!firstSuggestion) throw new Error('No location suggestions found');

            await firstSuggestion.click();

            console.log(`Location set to: ${location}`);
            return true;

        } catch (error) {
            console.warn(`Location set attempt ${attempt}/${maxRetries} failed:`, error.message);

            // On failure, pick a new random location for the next attempt
            location = getRandomLocation(locations);
            console.log(`Retrying with new location: ${location}`);

            if (attempt === maxRetries) return false;

            // Wait for a short delay before retrying
            await tab.waitForTimeout(delays.retry);
        }
    }
}




// Click the 'Next' button
async function clickNext(tab) {
    try {
        const buttonClicked = await tab.evaluate(() => {
            const nextButton = document.evaluate(
                '//span[contains(text(),"Next")] | //button[contains(text(),"Next")]',
                document,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
            ).singleNodeValue;

            if (nextButton) {
                nextButton.click();
                return true;
            }
            return false;
        });

        if (buttonClicked) {
            console.log("Clicked on Next.");

        } else {
            console.error("Next button not found.");
        }
    } catch (err) {
        console.error(`Exception occurred while clicking 'Next': ${err.message}`);
    }
}




module.exports = {
    runDraftPublisher
};
