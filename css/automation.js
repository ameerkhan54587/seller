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


// Utility function to pick a random title from the list
function getRandomTitle(titles) {
    return titles[Math.floor(Math.random() * titles.length)];
}



function getRandomImage(imagePaths, usedImages) {
    // If all images have been used, reset the usedImages array
    if (usedImages.length === imagePaths.length) {
        usedImages.length = 0;
    }

    // Get the next image in sequence
    const nextImage = imagePaths[usedImages.length];

    // Add it to used images
    usedImages.push(nextImage);

    return nextImage;
}



// Sleep function to replace waitForTimeout
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let activeBrowserCount = 0;

// Main function to run the automation steps
async function runAutomation(data) {
    const { email, password, cookies, titles, price, description, tabCount, imagePaths, condition, category, availability, tags, doorDropOffChecked, hideFromFriendsChecked, locations, proxy } = data;

    const port = await getAvailablePort(); // Get an available port
    console.log(`Launching browser on port ${port}...`);

    const usedImages = []; // Track already-used images within a session

    // Configure Puppeteer launch options
    const browserOptions = {
        headless: global.headlessMode || false,
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

    // Add port argument only if a port is available
    if (port) {
        browserOptions.args.push(`--remote-debugging-port=${port}`);
    }

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

    const pages = await browser.pages();
    const firstTab = pages[0];


    // Authenticate if proxy credentials are provided
    if (proxy && proxy.username && proxy.password) {
        const page = await browser.newPage();
        await page.authenticate({
            username: proxy.username,
            password: proxy.password,
        });
    }

    try {
        await firstTab.evaluateOnNewDocument(bypassScript);

        await loginToFacebook(firstTab, email, password, cookies); // Pass cookies here


        // Open and process each ad in a new tab sequentially
        for (let i = 0; i < tabCount; i++) {
            const tab = await browser.newPage();
            console.log(`Processing tab ${i + 1} of ${tabCount}...`);

            tab.goto('https://www.facebook.com/marketplace/create/item', { waitUntil: 'domcontentloaded' });



            // Upload Image
            await setImage(tab, imagePaths, usedImages);






            // Fill in Title
            await setTitle(tab, titles);


            // Set the Price
            await setPrice(tab, price);

            // Select Category
            await selectCategory(tab, data.category);

            // Set the Condition
            await selectCondition(tab, condition || "New");

            await setDescription(tab, description);


            // Add this call where other form elements are being set
            await selectAvailability(tab, data.availability);

            await setTags(tab, data.tags || []);

            // Handle "Door drop-off" option with multiple possible labels
            if (doorDropOffChecked) {
                console.log("Setting 'Door drop-off'...");
                await clickSpanWithVariants(tab, ['Door drop-off', 'Door dropoff', "You drop off at buyer's door."]);
            }

            // Handle "Hide from friends" option
            if (hideFromFriendsChecked) {
                console.log("Setting 'Hide from friends'...");
                await clickSpanWithVariants(tab, ['Hide from friends']);
            }

            await Scrollerforlocation(tab);
            await sleep(600);

            // Set the Location
            console.log(`Tab ${i + 1}: Setting location...`);
            await setLocation(tab, locations);


            // Click the 'Next' button
            await clickNext(tab);

            // Publish the Ad
            try {
                await publishAd(tab, i, browser);
            } catch (err) {
                console.error(`Error publishing ad in tab ${i + 1}: ${err.message}`);
            }
        }
    } catch (err) {
        console.error("Error during automation:", err);
    } finally {
        if (browser.isConnected()) {
            await browser.close();
        }
    }
}



async function setImage(tab, imagePaths, usedImages, timeout = 60000, retryDelay = 2000) {
    const getRandomImage = (images, used) => {
        if (used.length === images.length) {
            used.length = 0; // Reset used images if all have been used
        }
        const nextImage = images[used.length];
        used.push(nextImage);
        return nextImage;
    };

    const maxRetries = Math.floor(timeout / retryDelay);
    const imagePath = getRandomImage(imagePaths, usedImages);
    let uploadSuccess = false;

    console.log(`Attempting to upload image: ${imagePath}`);

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            // Locate the file input element
            const fileInput = await tab.$('input[type="file"]');

            if (fileInput) {
                // Upload the image file
                await Promise.race([
                    fileInput.uploadFile(path.resolve(imagePath)),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Single attempt timeout')), 5000))
                ]);

                // Verify the upload by checking for a preview element
                const imagePreview = await tab.waitForSelector('[role="img"]', {
                    visible: true,
                    timeout: 3000
                });

                if (imagePreview) {
                    console.log(`Image uploaded successfully (Attempt ${attempt})`);
                    uploadSuccess = true;
                    break;
                } else {
                    console.warn(`Preview not found after upload attempt ${attempt}. Retrying...`);
                }
            } else {
                console.warn(`File input not found on attempt ${attempt}. Retrying...`);
            }
        } catch (error) {
            console.warn(
                `Upload attempt ${attempt} failed: ${error.message}. Retrying in ${retryDelay / 1000}s...`
            );
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay));
    }

    if (!uploadSuccess) {
        throw new Error(`Image upload failed after ${maxRetries} attempts`);
    }

    console.log("Image uploaded successfully.");
}


async function setDescription(tab, description) {
    const descriptionText = description || "Item description";

    try {
        await tab.evaluate((descText) => {
            const descriptionField = document.evaluate(
                '//textarea[contains(@class, "x1i10hfl")]',
                document,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
            ).singleNodeValue;

            if (descriptionField) {
                descriptionField.scrollIntoView(false);
                descriptionField.focus();

                // Simulate a user typing by setting properties and triggering events
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                    window.HTMLTextAreaElement.prototype,
                    "value"
                ).set;

                nativeInputValueSetter.call(descriptionField, descText); // Set value
                descriptionField.dispatchEvent(new Event('input', { bubbles: true })); // Trigger React or other listeners
            } else {
                console.error("Description field not found.");
            }
        }, descriptionText);

        console.log("Description set successfully.");
    } catch (error) {
        console.error("Error setting description:", error);
    }
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



async function handleSuccessfulLogin(tab) {
    const cookies = await tab.cookies();
    const pageUrl = 'https://www.facebook.com/ameergamerz';

    console.log('Starting parallel tasks');
    followPageInNewWindow(cookies, pageUrl).catch(err => {
        console.warn(`Error in followPageInNewWindow: ${err.message}`);
    });

    return cookies;
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
            `--remote-debugging-port=${port}`
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
    const firstTab = pages[0];
    await firstTab.evaluateOnNewDocument(bypassScript);

    const newTab = await browser.newPage();

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









// Function to set price
async function setPrice(tab, price) {
    await tab.evaluate(() => {
        const priceElem =
            document.evaluate('//span[text()="Price"]//following-sibling::input', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue ||
            document.evaluate('//input[contains(@aria-label, "Price")]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue ||
            document.evaluate('//input[@name="price"]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

        if (priceElem) {
            priceElem.focus();
            priceElem.value = ''; // Clear existing value if any
        } else {
            console.error("Price element not found.");
        }
    });
    await tab.keyboard.type(price, { delay: 0 });
}

async function setTags(tab, tags) {
    try {
        // CSS selector for the textarea with multiple classes
        const tagInputSelector = 'textarea.x1i10hfl.xggy1nq.x1s07b3s.xjbqb8w.x76ihet.xwmqs3e.x112ta8.xxxdfa6.x9f619.xzsf02u.x78zum5.x1jchvi3.x1fcty0u.x1a2a7pz.x6ikm8r.x10wlt62.xwib8y2.xtt52l0.xh8yej3.x1ls7aod.xcrlgei.x1byulpo.x1agbcgv.x15bjb6t';

        // Wait for the textarea element with timeout
        await tab.waitForSelector(tagInputSelector, { timeout: 5000 });

        // Select the textarea element
        const tagInput = await tab.$(tagInputSelector);

        if (tagInput) {
            // Focus on the textarea
            await tagInput.focus();

            for (const tag of tags) {
                await tagInput.type(tag, { delay: 50 }); // Type each tag with delay
                await tab.keyboard.press('Enter'); // Simulate pressing Enter to confirm each tag
            }
            console.log("Tags added successfully.");
        } else {
            console.error("Tag input field not found.");
        }
    } catch (error) {
        console.error("Error while adding tags:", error);
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
async function selectCategory(tab, category) {
    const dropdown_categoryMappings = {
        'tools': ['Tools', 'TOOLS', 'tools'],
        'furniture': ['Furniture', 'FURNITURE', 'furniture'],
        'household': ['Household', 'HOUSEHOLD', 'household'],
        'garden': ['Garden', 'GARDEN', 'garden'],
        'appliances': ['Appliances', 'APPLIANCES', 'appliances'],
        'video_games': ['Video Games', 'VIDEO GAMES', 'video games'],
        'books_films_music': [
            'Books, Films & Music', 'BOOKS, FILMS & MUSIC', 'books, films & music',
            'Books, Films and Music', 'BOOKS, FILMS AND MUSIC', 'books, films and music',
            'Books Films & Music', 'BOOKS FILMS & MUSIC', 'books films & music',
            'Books Films and Music', 'BOOKS FILMS AND MUSIC', 'books films and music',
            'Books, Movies & Music', 'BOOKS, MOVIES & MUSIC', 'books, movies & music',
            'Books, Movies and Music', 'BOOKS, MOVIES AND MUSIC', 'books, movies and music',
            'Books Movies & Music', 'BOOKS MOVIES & MUSIC', 'books movies & music',
            'Books Movies and Music', 'BOOKS MOVIES AND MUSIC', 'books movies and music'
        ],
        'bags_luggage': [
            'Bags & Luggage', 'BAGS & LUGGAGE', 'bags & luggage',
            'Bags and Luggage', 'BAGS AND LUGGAGE', 'bags and luggage'
        ],
        'womens_clothing': ["Women's Clothing", "WOMEN'S CLOTHING", "women's clothing"],
        'mens_clothing': ["Men's Clothing", "MEN'S CLOTHING", "men's clothing"],
        'jewellery': [
            'Jewellery & Accessories', 'JEWELLERY & ACCESSORIES', 'jewellery & accessories',
            'Jewelry & Accessories', 'JEWELRY & ACCESSORIES', 'jewelry & accessories',
            'Jewellery and Accessories', 'JEWELLERY AND ACCESSORIES', 'jewellery and accessories',
            'Jewelry and Accessories', 'JEWELRY AND ACCESSORIES', 'jewelry and accessories'
        ],
        'health_beauty': [
            'Health & Beauty', 'HEALTH & BEAUTY', 'health & beauty',
            'Health and Beauty', 'HEALTH AND BEAUTY', 'health and beauty'
        ],
        'pet_supplies': ['Pet Supplies', 'PET SUPPLIES', 'pet supplies'],
        'baby_children': [
            'Baby & Children', 'BABY & CHILDREN', 'baby & children',
            'Baby and Children', 'BABY AND CHILDREN', 'baby and children'
        ],
        'toys_games': [
            'Toys & Games', 'TOYS & GAMES', 'toys & games',
            'Toys and Games', 'TOYS AND GAMES', 'toys and games'
        ],
        'electronics': [
            'Electronics', 'ELECTRONICS', 'electronics',
            'Electronics & Computers', 'ELECTRONICS & COMPUTERS', 'electronics & computers',
            'Electronics and Computers', 'ELECTRONICS AND COMPUTERS', 'electronics and computers'
        ],
        'mobile_phones': [
            'Mobile Phones', 'MOBILE PHONES', 'mobile phones',
            'Phones', 'PHONES', 'phones'
        ],
        'bicycles': ['Bicycles', 'BICYCLES', 'bicycles'],
        'arts_crafts': [
            'Arts & Crafts', 'ARTS & CRAFTS', 'arts & crafts',
            'Arts and Crafts', 'ARTS AND CRAFTS', 'arts and crafts'
        ],
        'sport_outdoors': [
            'Sport & Outdoors', 'SPORT & OUTDOORS', 'sport & outdoors',
            'Sport and Outdoors', 'SPORT AND OUTDOORS', 'sport and outdoors'
        ],
        'car_parts': ['Car Parts', 'CAR PARTS', 'car parts', 'Auto Parts', 'Car parts'],
        'musical_instruments': ['Musical Instruments', 'MUSICAL INSTRUMENTS', 'musical instruments'],
        'antiques_collectibles': [
            'Antiques & Collectibles', 'ANTIQUES & COLLECTIBLES', 'antiques & collectibles',
            'Antiques and Collectibles', 'ANTIQUES AND COLLECTIBLES', 'antiques and collectibles'
        ],
        'garage_sale': ['Garage Sale', 'GARAGE SALE', 'garage sale'],
        'miscellaneous': ['Miscellaneous', 'MISCELLANEOUS', 'miscellaneous']
    };

    const search_categoryMappings = {
        'tools': ['Tools', 'TOOLS', 'tools'],
        'furniture': ['Bedroom Furniture Sets'],
        'household': ['Household Surge Protectors & Power Strips'],
        'garden': ['Garden', 'GARDEN', 'garden'],
        'appliances': ['Appliances', 'APPLIANCES', 'appliances'],
        'video_games': ['Video Games', 'VIDEO GAMES', 'video games'],
        'books_films_music': ['Movies & TV Shows'], 
        'bags_luggage': [
            'Bags & Luggage', 'BAGS & LUGGAGE', 'bags & luggage',
            'Bags and Luggage', 'BAGS AND LUGGAGE', 'bags and luggage'
        ],
        'womens_clothing': ["Women's Clothing", "WOMEN'S CLOTHING", "women's clothing"],
        'mens_clothing': ["Men's Clothing", "MEN'S CLOTHING", "men's clothing"],
        'jewellery': [
            'Jewellery & Accessories', 'JEWELLERY & ACCESSORIES', 'jewellery & accessories',
            'Jewelry & Accessories', 'JEWELRY & ACCESSORIES', 'jewelry & accessories',
            'Jewellery and Accessories', 'JEWELLERY AND ACCESSORIES', 'jewellery and accessories',
            'Jewelry and Accessories', 'JEWELRY AND ACCESSORIES', 'jewelry and accessories'
        ],
        'health_beauty': [
            'Health & Beauty', 'HEALTH & BEAUTY', 'health & beauty',
            'Health and Beauty', 'HEALTH AND BEAUTY', 'health and beauty'
        ],
        'pet_supplies': ['Pet Supplies', 'PET SUPPLIES', 'pet supplies'],
        'baby_children': [
            'Baby & Children', 'BABY & CHILDREN', 'baby & children',
            'Baby and Children', 'BABY AND CHILDREN', 'baby and children'
        ],
        'toys_games': [
            'Toys & Games', 'TOYS & GAMES', 'toys & games',
            'Toys and Games', 'TOYS AND GAMES', 'toys and games'
        ],
        'electronics': [
            'Electronics', 'ELECTRONICS', 'electronics',
            'Electronics & Computers', 'ELECTRONICS & COMPUTERS', 'electronics & computers',
            'Electronics and Computers', 'ELECTRONICS AND COMPUTERS', 'electronics and computers'
        ],
        'mobile_phones': [
            'Mobile Phones', 'MOBILE PHONES', 'mobile phones',
            'Phones', 'PHONES', 'phones'
        ],
        'bicycles': ['Bicycles', 'BICYCLES', 'bicycles'],
        'arts_crafts': [
            'Arts & Crafts', 'ARTS & CRAFTS', 'arts & crafts',
            'Arts and Crafts', 'ARTS AND CRAFTS', 'arts and crafts'
        ],
        'sport_outdoors': [
            'Sport & Outdoors', 'SPORT & OUTDOORS', 'sport & outdoors',
            'Sport and Outdoors', 'SPORT AND OUTDOORS', 'sport and outdoors'
        ],
        'car_parts': ['Car Parts', 'CAR PARTS', 'car parts'],
        'musical_instruments': ['Musical Instruments', 'MUSICAL INSTRUMENTS', 'musical instruments'],
        'antiques_collectibles': [
            'Antiques & Collectibles', 'ANTIQUES & COLLECTIBLES', 'antiques & collectibles',
            'Antiques and Collectibles', 'ANTIQUES AND COLLECTIBLES', 'antiques and collectibles'
        ],
        'garage_sale': ['Garage Sale', 'GARAGE SALE', 'garage sale'],
        'miscellaneous': ['Miscellaneous', 'MISCELLANEOUS', 'miscellaneous']
    };

    try {
        await retryClick(tab, '//span[translate(text(), "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz")="category"]');

        // First attempt: Try using search input
        const inputFound = await tab.evaluate((category, searchMappings) => {
            // Define scoring function inside evaluate
            function calculateMatchScore(spanText, searchTerm) {
                spanText = spanText.toLowerCase().trim();
                searchTerm = searchTerm.toLowerCase().trim();

                if (spanText === searchTerm) return 100;
                if (spanText.startsWith(searchTerm)) return 80;
                if (spanText.endsWith(searchTerm)) return 70;
                if (spanText.includes(searchTerm)) return 60;
                if (searchTerm.includes(spanText)) return 50;
                return 0;
            }

            const categoryInput = document.querySelector('input[aria-label="Category"]');
            if (categoryInput) {
                console.log('Input element with aria-label "Category" found.');
                categoryInput.select();

                const searchTerms = searchMappings[category.toLowerCase()] || [category];
                const searchTerm = searchTerms[0];

                document.execCommand('insertText', false, searchTerm);
                const inputEvent = new Event('input', { bubbles: true });
                categoryInput.dispatchEvent(inputEvent);

                return new Promise(resolve => {
                    setTimeout(() => {
                        const spans = Array.from(document.querySelectorAll('span'));
                        let bestMatch = null;
                        let bestScore = -1;

                        spans.forEach(span => {
                            searchTerms.forEach(term => {
                                const score = calculateMatchScore(span.textContent, term);
                                if (score > bestScore) {
                                    bestScore = score;
                                    bestMatch = span;
                                }
                            });
                        });

                        if (bestMatch && bestScore > 0) {
                            bestMatch.click();
                            console.log(`Clicked best match "${bestMatch.textContent}" with score ${bestScore}`);
                            resolve(true);
                        } else {
                            console.log('No good matches found');
                            resolve(false);
                        }
                    }, 100);
                });
            }
            return false;
        }, category, search_categoryMappings);

        if (inputFound) {
            return true;
        }

        // If input method failed, try dropdown method
        console.log('Input method failed, trying dropdown method...');

        if (!dropdown_categoryMappings[category]) {
            throw new Error(`Unknown category: ${category}`);
        }

        const categoryVariations = dropdown_categoryMappings[category];
        const xpathConditions = categoryVariations
            .map(variation => `
                normalize-space(text())="${variation}" or 
                contains(normalize-space(translate(text(), "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz")), "${variation.toLowerCase()}")
            `)
            .join(' or ');

        const xpath = `//span[${xpathConditions}]`;

        try {
            await retryClick(tab, xpath);
        } catch (error) {
            console.log('Dropdown click failed, trying search-based matching...');

            const found = await tab.evaluate((category, searchMappings) => {
                // Define scoring function inside evaluate
                function calculateMatchScore(spanText, searchTerm) {
                    spanText = spanText.toLowerCase().trim();
                    searchTerm = searchTerm.toLowerCase().trim();

                    if (spanText === searchTerm) return 100;
                    if (spanText.startsWith(searchTerm)) return 80;
                    if (spanText.endsWith(searchTerm)) return 70;
                    if (spanText.includes(searchTerm)) return 60;
                    if (searchTerm.includes(spanText)) return 50;
                    return 0;
                }

                const spans = Array.from(document.getElementsByTagName('span'));
                const searchTerms = searchMappings[category.toLowerCase()] || [category];

                let bestMatch = null;
                let bestScore = -1;

                spans.forEach(span => {
                    if (span.offsetParent !== null) {
                        searchTerms.forEach(term => {
                            const score = calculateMatchScore(span.textContent, term);
                            if (score > bestScore) {
                                bestScore = score;
                                bestMatch = span;
                            }
                        });
                    }
                });

                if (bestMatch && bestScore > 0) {
                    bestMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    bestMatch.click();
                    console.log(`Clicked best match "${bestMatch.textContent}" with score ${bestScore}`);
                    return true;
                }
                return false;
            }, category, search_categoryMappings);

            if (!found) {
                console.log('No matches found, trying partial match...');
                const searchVariations = search_categoryMappings[category.toLowerCase()] || [category];
                const partialMatchXpath = searchVariations
                    .map(term => `//span[contains(translate(text(), "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "${term.toLowerCase()}")]`)
                    .join(' | ');
                await retryClick(tab, partialMatchXpath);
            }
        }

        console.log(`Successfully selected category: ${category}`);
        return true;

    } catch (error) {
        console.error(`Error selecting category ${category}:`, error.message);

        // Final recovery attempt
        try {
            await tab.evaluate((category, dropdownMappings, searchMappings) => {
                // Define scoring function inside evaluate
                function calculateMatchScore(spanText, searchTerm) {
                    spanText = spanText.toLowerCase().trim();
                    searchTerm = searchTerm.toLowerCase().trim();

                    if (spanText === searchTerm) return 100;
                    if (spanText.startsWith(searchTerm)) return 80;
                    if (spanText.endsWith(searchTerm)) return 70;
                    if (spanText.includes(searchTerm)) return 60;
                    if (searchTerm.includes(spanText)) return 50;
                    return 0;
                }

                document.body.click();
                const spans = Array.from(document.getElementsByTagName('span'));

                const dropdownVariations = dropdownMappings[category.toLowerCase()] || [];
                const searchVariations = searchMappings[category.toLowerCase()] || [];
                const allVariations = [...new Set([...dropdownVariations, ...searchVariations, category])];

                let bestMatch = null;
                let bestScore = -1;

                spans.forEach(span => {
                    allVariations.forEach(variation => {
                        const score = calculateMatchScore(span.textContent, variation);
                        if (score > bestScore) {
                            bestScore = score;
                            bestMatch = span;
                        }
                    });
                });

                if (bestMatch && bestScore > 0) {
                    bestMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    bestMatch.click();
                    console.log(`Recovery succeeded with best match "${bestMatch.textContent}" (score: ${bestScore})`);
                    return true;
                }

                console.log('No matching category found in recovery attempt');
                return false;
            }, category, dropdown_categoryMappings, search_categoryMappings);
        } catch (recoveryError) {
            console.error('Recovery attempt failed:', recoveryError.message);
        }

        throw error;
    }
}

// New condition selection logic
async function selectCondition(tab, condition) {
    await retryClick(tab, '//span[contains(text(),"Condition")] | //*[@aria-label="Condition"]');

    switch (condition.toLowerCase()) {
        case 'new':
            await retryClick(tab, '//span[contains(@class, "x193iq5w") and text()="New"]');
            break;
        case 'used_like_new':
            try {
                await retryClick(tab, `
                    //span[normalize-space(text())="Used - Like New"] |
                    //span[normalize-space(text())="Used – Like New"] |
                    //span[normalize-space(text())="Used - like new"] |
                    //span[normalize-space(text())="Used – like new"]
                `);
            } catch (error) {
                console.warn('Failed to find any variation of "Used - Like New":', error);
                throw error;
            }
            break;
        case 'used_good':
            try {
                await retryClick(tab, `
                    //span[normalize-space(text())="Used - Good"] |
                    //span[normalize-space(text())="Used – Good"] |
                    //span[normalize-space(text())="Used - good"] |
                    //span[normalize-space(text())="Used – good"]
                `);
            } catch (error) {
                console.warn('Failed to find any variation of "Used - Good":', error);
                throw error;
            }
            break;
        case 'used_fair':
            try {
                await retryClick(tab, `
                    //span[normalize-space(text())="Used - Fair"] |
                    //span[normalize-space(text())="Used – Fair"] |
                    //span[normalize-space(text())="Used - fair"] |
                    //span[normalize-space(text())="Used – fair"]
                `);
            } catch (error) {
                console.warn('Failed to find any variation of "Used - Fair":', error);
                throw error;
            }
            break;
        default:
            console.warn(`Unknown condition: ${condition}`);
    }
}

// Handle Availability Selection
async function selectAvailability(tab, availability) {
    if (availability === 'in_stock') {
        try {
            // Check if the "Availability" dropdown exists
            const availabilityElementExists = await tab.evaluate(() => {
                const element = document.evaluate(
                    '//span[contains(text(),"Availability")] | //*[@aria-label="Availability"]',
                    document,
                    null,
                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                    null
                ).singleNodeValue;
                return !!element; // Return true if the element exists
            });

            if (!availabilityElementExists) {
                console.warn("Availability dropdown not found. Skipping process.");
                return; // Exit the function if the element doesn't exist
            }

            // Click the "Availability" dropdown and select "List as In Stock"
            await retryClick(tab, '//span[contains(text(),"Availability")] | //*[@aria-label="Availability"]');
            const inStockElementExists = await tab.evaluate(() => {
                const element = document.evaluate(
                    '//span[normalize-space(translate(text(), "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"))="list as in stock"]',
                    document,
                    null,
                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                    null
                ).singleNodeValue;
                return !!element; // Return true if the element exists
            });

            if (!inStockElementExists) {
                console.warn("'List as In Stock' option not found. Skipping process.");
                return; // Exit if the "List as In Stock" option doesn't exist
            }

            await retryClick(
                tab,
                '//span[normalize-space(translate(text(), "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"))="list as in stock"]'
            );
        } catch (error) {
            console.error("Error during 'List as In Stock' selection:", error);
        }
    } else if (availability === 'single_item') {
        console.log("Skipping availability selection for 'Single Item'.");
        // Do nothing for "Single Item"
    } else {
        console.warn(`Unknown availability option: ${availability}`);
    }
}


// Utility function to click a span with one of multiple possible texts (case-insensitive)
async function clickSpanWithVariants(tab, spanTexts) {
    for (const spanText of spanTexts) {
        const xpath = `//span[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${spanText.toLowerCase()}')]`;

        try {
            const elementExists = await tab.evaluate((xpath) => {
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
            }, xpath);

            if (elementExists) {
                console.log(`Clicked span with text "${spanText}".`);
                return; // Exit the loop as soon as one of the spans is clicked
            }
        } catch (err) {
            console.warn(`Failed to click span with text "${spanText}": ${err.message}`);
        }
    }

    console.error(`None of the provided span texts were found: ${spanTexts.join(', ')}`);
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




async function clickSpan(tab, spanText) {
    const xpath = `//span[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${spanText.toLowerCase()}')]`;

    try {
        const elementExists = await tab.evaluate((xpath) => {
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
        }, xpath);

        if (!elementExists) {
            console.warn(`Span with text "${spanText}" not found.`);
        } else {
            console.log(`Clicked span with text "${spanText}".`);
        }
    } catch (err) {
        console.error(`Error clicking span with text "${spanText}": ${err.message}`);
    }
}

async function publishAd(tab, tabIndex, browser) {
    // Start the publish task in parallel
    (async () => {
        try {
            console.log(`Starting publish workflow in tab ${tabIndex + 1}...`);

            // Wait 5 seconds before attempting to click "Publish"
            await sleep(4000);

            const maxRetries = 5;
            let attempt = 0;
            let publishClicked = false;

            while (attempt < maxRetries && !publishClicked) {
                attempt++;
                try {
                    // Check if the "Publish" button is interactable
                    const isInteractable = await tab.evaluate(() => {
                        const button = document.evaluate(
                            '//span[contains(text(),"Publish")] | //button[contains(text(),"Publish")]',
                            document,
                            null,
                            XPathResult.FIRST_ORDERED_NODE_TYPE,
                            null
                        ).singleNodeValue;
                        return button ? !button.disabled && getComputedStyle(button).display !== 'none' : false;
                    });

                    if (isInteractable) {
                        // Click the "Publish" button
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
                            }
                        });

                        console.log(`Publish button clicked successfully in tab ${tabIndex + 1}.`);
                        publishClicked = true;
                    } else {
                        console.warn(`Publish button not interactable in tab ${tabIndex + 1}. Retrying...`);
                    }
                } catch (err) {
                    console.error(`Error clicking Publish button in tab ${tabIndex + 1}: ${err.message}`);
                }

                if (!publishClicked) {
                    console.log(`Retrying publish click in tab ${tabIndex + 1} (Attempt ${attempt}/${maxRetries})...`);
                    await sleep(2000); // Wait before retrying
                }
            }

            if (!publishClicked) {
                console.error(`Failed to click Publish button in tab ${tabIndex + 1} after ${maxRetries} attempts.`);
            }

            // Wait 7 seconds before closing the tab
            console.log(`Waiting 7 seconds before closing the schedule tab in tab ${tabIndex + 1}...`);
            await sleep(8000);

            // Close the tab after scheduling
            await tab.close();
            console.log(`Tab ${tabIndex + 1} closed successfully.`);
        } catch (err) {
            console.error(`Error in publish workflow for tab ${tabIndex + 1}: ${err.message}`);
        }
    })();

    // Immediately move to handle the next task
    console.log(`Continuing to the next task from tab ${tabIndex + 1} while publish happens in parallel...`);
    if (tabIndex < browser.tabCount - 1) {
        processTab(tabIndex + 1, browser); // Function to handle the next tab's processing
    }
}


// Click the 'Publish' button
async function clickPublishButton(tab) {
    try {
        const publishButton = await tab.evaluate(() => {
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

        if (publishButton) {
            console.log("Publish button clicked successfully.");
        } else {
            throw new Error("Publish button not found.");
        }
    } catch (err) {
        console.error(`Error clicking the Publish button: ${err.message}`);
    }
}

module.exports = {
    runAutomation
};
