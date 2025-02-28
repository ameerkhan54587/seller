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

// Main function to run the automation steps
// Main function to run the automation steps
async function runDeleteDuplicate(data) {
    const { email, password, cookies, titles, price, description, tabCount, imagePaths, condition, category, availability, tags, doorDropOffChecked, hideFromFriendsChecked, locations, proxy } = data;

    const port = await getAvailablePort(); // Get an available port
    console.log(`Launching browser on port ${port}...`);

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
            '--incognito'
        ],
        defaultViewport: null
    };

    // Add port argument only if a port is available
    if (port) {
        browserOptions.args.push(`--remote-debugging-port=${port}`);
    }

    // Add proxy settings if provided
    if (proxy && proxy.address) {
        browserOptions.args.push(`--proxy-server=${proxy.address}`);
    }

    const browser = await puppeteer.launch(browserOptions);



    // Create an incognito context
    const context = await browser.createIncognitoBrowserContext();

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


    // Create the first tab in the incognito context and navigate directly to the desired URL
    const firstTab = await context.newPage();


    // Authenticate if proxy credentials are provided
    if (proxy && proxy.username && proxy.password) {
        await firstTab.authenticate({
            username: proxy.username,
            password: proxy.password,
        });
    }

    try {
        // Inject the bypass script into the first tab
        await firstTab.evaluateOnNewDocument(bypassScript);

        // Close the default blank page if it exists
        const pages = await browser.pages();
        if (pages.length > 0) {
            await pages[0].close();
        }

        // Log in to Facebook
        await loginToFacebook(firstTab, email, password, cookies);

        // Navigate to the draft listings page
        const draftTab = await context.newPage();
        await draftTab.goto('https://www.facebook.com/marketplace/you/selling/', { waitUntil: 'networkidle2' });



        // Execute the deletion process
        await delete_Duplicate_Listings(draftTab);
        console.log("Draft deletion process completed successfully");



    } catch (err) {
        console.error("Error during automation:", err);
    } finally {
        if (browser.isConnected()) {
            await browser.close();
        }
    }
}

async function delete_Duplicate_Listings(tab) {
    try {
        const deletedListings = new Set(); // Track deleted listings to avoid re-processing

        while (true) {
            // Wait for the page to load listings
            await tab.waitForSelector('div.x9f619.x1ja2u2z.x78zum5.x1n2onr6.x1r8uery.x1iyjqo2.xs83m0k.xeuugli.x1qughib.x6s0dn4.xozqiw3.x1q0g3np.x1pi30zi.x1swvt13.x1l90r2v.xyamay9.xykv574.xbmpl8g.x4cne27.xifccgj', { timeout: 5000 });

            // Check for the duplicate listing message
            const duplicateMessage = await tab.evaluate(() => {
                const messageElement = document.evaluate(
                    '//div[contains(text(), "It looks like you created a duplicate listing.")]',
                    document,
                    null,
                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                    null
                ).singleNodeValue;
                return messageElement ? messageElement.textContent.trim() : null;
            });

            if (duplicateMessage) {
                console.log("Duplicate listing found:", duplicateMessage);

                // Locate the parent div
                const parentDiv = await tab.$('div.x9f619.x1ja2u2z.x78zum5.x1n2onr6.x1r8uery.x1iyjqo2.xs83m0k.xeuugli.x1qughib.x6s0dn4.xozqiw3.x1q0g3np.x1pi30zi.x1swvt13.x1l90r2v.xyamay9.xykv574.xbmpl8g.x4cne27.xifccgj');
                if (parentDiv) {
                    console.log("Parent div found.");

                    // Find the "More options" button inside the parent div
                    const moreOptionsButton = await parentDiv.$('div[aria-label^="More options for"]');
                    if (moreOptionsButton) {
                        console.log("'More options' button found.");

                        // Scroll the button into view
                        await moreOptionsButton.evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
                        console.log("Scrolled 'More options' button into view.");

                        // Wait for the button to be visible
                        await tab.waitForFunction(
                            (el) => el.offsetParent !== null, // Check if the element is visible
                            {},
                            moreOptionsButton
                        );
                        console.log("'More options' button is now visible.");

                        // Click the button
                        await moreOptionsButton.click();
                        console.log("Clicked on 'More options' button.");
                    } else {
                        console.error("'More options' button not found inside the parent div.");
                    }
                } else {
                    console.error("Parent div not found.");
                }
            } else {
                console.log("No more duplicate listings found.");
                break; // Exit the loop if no more duplicates are found
            }

            // Scroll down to load more listings
            await tab.evaluate(() => {
                window.scrollBy(0, window.innerHeight);
            });

            // Wait for new listings to load
            await sleep(2000); // Adjust the delay as needed
        }

        console.log("Duplicate listing deletion process completed.");
    } catch (error) {
        console.error("Fatal error during deletion process:", error);
        throw error;
    }
}

async function findConfirmDeleteButton(page, timeout = 1500) {
    try {
        const buttonSelectors = [
            'span.x1lliihq.x6ikm8r.x10wlt62.x1n2onr6.xlyipyv.xuxw1ft',
            'button[role="button"]',
            '[aria-label*="Delete"]'
        ];

        for (const selector of buttonSelectors) {
            const elements = await page.$$(selector);
            for (const element of elements) {
                const text = await page.evaluate(el => el.textContent.trim(), element);
                if (text === "Delete") {
                    const pos = await page.evaluate(el => {
                        const rect = el.getBoundingClientRect();
                        return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
                    }, element);

                    await moveRobotCursor(page, pos.x, pos.y);
                    await element.click();
                    return true;
                }
            }
        }
        return false;
    } catch (error) {
        console.error("Error finding confirm button:", error);
        return false;
    }
}

async function moveRobotCursor(page, x, y) {
    // Simulate human-like mouse movement to the specified coordinates
    await page.mouse.move(x, y, { steps: 10 });
    await sleep(500); // Add a small delay to mimic human behavior
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
                return await handleSuccessfulLogin(tab); // Proceed with automation
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

    const port = await getAvailablePort(); // Get an available port
    console.log(`Launching browser on port ${port}...`);

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
            `--remote-debugging-port=${port}`,
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
            // Evaluate XPath in the browser context
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
        dropdown: 800,
        retry: 1000
    };

    let location = specificLocation || getRandomLocation(locations);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const locationInput = await tab.waitForSelector('input[aria-label="Location"]', {
                visible: true,
                timeout: 5000
            });

            if (!locationInput) throw new Error('Location input not found');

            await locationInput.click({ clickCount: 3 });
            await locationInput.press('Backspace');
            await tab.keyboard.sendCharacter(location);

            await tab.waitForSelector('ul[role="listbox"]', {
                visible: true,
                timeout: 5000
            });

            await sleep(delays.dropdown);

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
            await sleep(delays.retry);
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
async function handleCookieConsentOnAdPage(tab) {
    try {
        // Target the exact span element containing "Allow all cookies"
        const targetText = "Allow all cookies";

        console.log("Checking for cookie consent dialog on the ad page...");

        // Retry logic to wait for the cookie popup to appear
        let attempts = 0;
        const maxAttempts = 1; // Number of retries
        const delayBetweenRetries = 1000; // 1 second between retries

        while (attempts < maxAttempts) {
            // Locate the span element with the specific class and text
            const buttons = await tab.$$(
                'span.x1lliihq.x6ikm8r.x10wlt62.x1n2onr6.xlyipyv.xuxw1ft'
            );

            for (const button of buttons) {
                const buttonText = await tab.evaluate(el => el.textContent.trim(), button);

                if (buttonText === targetText) {
                    console.log(`Found the exact button with text: "${buttonText}"`);
                    await button.click(); // Click the button
                    console.log("Clicked the 'Allow all cookies' button.");
                    return; // Exit after clicking
                }
            }

            // Wait for the next retry if no button is found
            attempts++;
            console.log(`No matching cookie consent button found. Retrying... (${attempts}/${maxAttempts})`);
            await sleep(delayBetweenRetries);
        }

        console.log("No matching cookie consent button found after retries.");
    } catch (err) {
        console.log(`Error handling cookie consent on ad page: ${err.message}`);
    }
}

// Utility function to handle sleep/delay
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}



module.exports = {
    runDeleteDuplicate
};
