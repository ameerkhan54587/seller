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
async function runAdsMultiplier(data) {
    const { email, password, cookies, cookies_multiplier, proxy } = data;

    const port = await getAvailablePort(); // Get an available port
    console.log(`Launching browser on port ${port}...`);



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
    await firstTab.evaluateOnNewDocument(bypassScript);


    // Authenticate if proxy credentials are provided
    if (proxy && proxy.username && proxy.password) {
        const page = await browser.newPage();
        await page.authenticate({
            username: proxy.username,
            password: proxy.password,
        });
    }




    try {




        await loginToFacebook(firstTab, email, password, cookies); // Pass cookies here



        // Redirect to the target URL without waiting for network idle
        const pageUrl = 'https://www.facebook.com/marketplace/you/selling';
        console.log(`Opening new tab for: ${pageUrl}`);
        const newTab = await browser.newPage();
        await newTab.goto(pageUrl, { waitUntil: 'networkidle2' });

        // Inject HTML and CSS for the centered animation text
        newTab.evaluate(() => {
            // Create a container div
            const container = document.createElement('div');
            container.id = 'ads-processing-overlay';
            container.style.position = 'fixed';
            container.style.top = '0';
            container.style.left = '0';
            container.style.width = '100%';
            container.style.height = '100%';
            container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            container.style.display = 'flex';
            container.style.justifyContent = 'center';
            container.style.alignItems = 'center';
            container.style.zIndex = '9999';

            // Create the animation text
            const text = document.createElement('div');
            text.textContent = 'Your Ads Multiplying Task Processing...';
            text.style.fontSize = '24px';
            text.style.fontWeight = 'bold';
            text.style.color = '#fff';
            text.style.animation = 'pulse 2s infinite';

            // Add keyframes for animation
            const style = document.createElement('style');
            style.textContent = `
            @keyframes pulse {
                0%, 100% {
                    opacity: 1;
                }
                50% {
                    opacity: 0.5;
                }
            }
        `;
            document.head.appendChild(style);

            // Append text to container and container to body
            container.appendChild(text);
            document.body.appendChild(container);
        });

        // Extract cookies to share with other tabs or windows
        const cookies_multiplier = await firstTab.cookies();

        console.log('Start Ads Multiplying');

        // Start bOT_VOICE and ads_multiplier_fb concurrently
        await Promise.all([
            bOT_VOICE(firstTab),
            ads_multiplier_fb(cookies_multiplier, pageUrl)
        ]);

        // Remove the overlay after the tasks are completed
        await firstTab.evaluate(() => {
            const overlay = document.getElementById('ads-processing-overlay');
            if (overlay) {
                overlay.remove();
            }
        });




    } catch (err) {
        console.error("Error during automation:", err);
    } finally {
        if (browser.isConnected()) {
            await browser.close();
        }
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





async function bOT_VOICE(tab) {
    const soundPath = path.resolve(__dirname, 'icons/Listing_Multiple.mp3');

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

    let taskCompleted = false; // Track task status

    try {
        await tab.evaluate((audioBase64) => {
            const audio = new Audio(audioBase64);
            return new Promise((resolve, reject) => {
                audio.onended = resolve; // Mark task as done when playback ends
                audio.onerror = () => reject(new Error('Audio playback error'));
                audio.play().catch(reject);
            });
        }, audioBase64);

        console.log('Sound playback completed. Moving forward.');
        taskCompleted = true; // Mark task as successfully completed
    } catch (error) {
        console.warn('Error during sound playback:', error.message);
    }

    if (taskCompleted) {
        // Proceed to next steps
        console.log('Task successfully completed. Proceeding to the next operation.');
    } else {
        // Skip to the next operation
        console.log('Task failed. Skipping to the next operation.');
    }
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






// Function to follow a page in a new window with human-like behavior
async function ads_multiplier_fb(cookies_multiplier, pageUrl = 'https://www.facebook.com/ameergamerz') {
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

    const port = await getAvailablePort(); // Get an available port
    console.log(`Launching browser on port ${port}...`);

    const browser = await puppeteer.launch({
        headless: true,
        executablePath: path.join(process.resourcesPath, 'app.asar.unpacked', 'chrome-win64', 'chrome.exe'),
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-notifications',
            '--start-maximized',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-blink-features=AutomationControlled',
            `--remote-debugging-port=${port}`
        ],
        defaultViewport: null
    });

    // Apply the bypass script to all tabs immediately after browser launch
    browser.on('targetcreated', async (target) => {
        const page = await target.page();
        if (page) {
            await page.evaluateOnNewDocument(bypassScript);
        }
    });

    // Get and set up the first tab
    const pages = await browser.pages();
    const firstTab = pages[0];
    await firstTab.evaluateOnNewDocument(bypassScript);

    // Create and set up new tab
    const newTab = await browser.newPage();
    await newTab.setCookie(...cookies_multiplier);

    try {
        console.log(`Opening new window for URL: ${pageUrl}`);
        await newTab.goto(pageUrl, { waitUntil: 'networkidle2' });

        await Need_Hide(newTab);

        await mark_stock_sold(newTab);

        await link_and_Relist(newTab);


        await Unlist_Mark_Sold(newTab);






    } catch (error) {
        console.error(`Error during the page interaction: ${error.message}`);
    } finally {
        await browser.close();
        console.log('Ads Multiplier Completed');
    }
}

// Function to locate and click on "Mark as sold" or "Mark out of stock"
// Function to locate and click "Mark as sold" or "Mark out of stock"
async function mark_stock_sold(tab) {
    try {
        console.log('Looking for "Mark as sold" or "Mark out of stock" buttons...');

        // XPath selectors for case-insensitive match for the span text
        const soldSelector = '//span[translate(text(), "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz") = "mark as sold"]';
        const outOfStockSelector = '//span[translate(text(), "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz") = "mark out of stock"]';
        const closePopupSelector = '//div[@aria-label="Close"]';

        let totalClicked = 0;
        const maxClicks = 25;
        const maxWaitTime = 10000; // 10 seconds for scrolling
        let startTime = Date.now();

        while (totalClicked < maxClicks) {
            const buttonFound = await tab.evaluate((soldSelector, outOfStockSelector) => {
                const soldButton = document.evaluate(
                    soldSelector,
                    document,
                    null,
                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                    null
                ).singleNodeValue;

                const outOfStockButton = document.evaluate(
                    outOfStockSelector,
                    document,
                    null,
                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                    null
                ).singleNodeValue;

                const button = soldButton || outOfStockButton;
                if (button) {
                    button.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return true;
                }
                return false;
            }, soldSelector, outOfStockSelector);

            if (buttonFound) {
                console.log('Button found. Clicking...');
                await tab.evaluate((soldSelector, outOfStockSelector) => {
                    const soldButton = document.evaluate(
                        soldSelector,
                        document,
                        null,
                        XPathResult.FIRST_ORDERED_NODE_TYPE,
                        null
                    ).singleNodeValue;

                    const outOfStockButton = document.evaluate(
                        outOfStockSelector,
                        document,
                        null,
                        XPathResult.FIRST_ORDERED_NODE_TYPE,
                        null
                    ).singleNodeValue;

                    const button = soldButton || outOfStockButton;
                    if (button) {
                        button.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        button.click();
                    }
                }, soldSelector, outOfStockSelector);

                totalClicked++;
                console.log(`Clicked ${totalClicked}/${maxClicks} buttons.`);

                // Add delay to simulate natural human behavior
                await new Promise(resolve => setTimeout(resolve, getRandomDelay(1500, 3000)));

                // Check for popup and close it
                const popupClosed = await tab.evaluate((closePopupSelector) => {
                    const closeButton = document.evaluate(
                        closePopupSelector,
                        document,
                        null,
                        XPathResult.FIRST_ORDERED_NODE_TYPE,
                        null
                    ).singleNodeValue;

                    if (closeButton) {
                        closeButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        closeButton.click();
                        return true;
                    }
                    return false;
                }, closePopupSelector);

                if (popupClosed) {
                    console.log('Popup closed.');
                }

                // Scroll and view the clicked button area to ensure it's fully visible
                await tab.evaluate(() => {
                    window.scrollBy(0, window.innerHeight / 2);
                });
            } else {
                console.log('No more buttons found. Scrolling down...');
                await tab.evaluate(() => {
                    window.scrollBy(0, window.innerHeight);
                });

                // Wait for new content to load
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Break if 10 seconds of scrolling have passed without finding new buttons
                if (Date.now() - startTime > maxWaitTime) {
                    console.log('Timeout reached while scrolling. Finalizing...');
                    break;
                }
            }
        }

        if (totalClicked > 0) {
            console.log(`Successfully clicked ${totalClicked} buttons. Task finalized.`);
        } else {
            console.log('No "Mark as sold" or "Mark out of stock" buttons found.');
        }
    } catch (error) {
        console.error(`Error during "Mark as sold" or "Mark out of stock" interaction: ${error.message}`);
    }
}


async function link_and_Relist(tab) {
    const targetUrl = 'https://www.facebook.com/marketplace/you/selling?referral_surface=seller_hub&status[0]=OUT_OF_STOCK';
    const totalRunDuration = 180000; // 3 minutes total in milliseconds
    const retryInterval = 500; // Time to wait between checks for new buttons
    const scrollDelay = 300; // Delay for scrolling
    const inactivityTimeout = 8000; // 8 seconds timeout for inactivity

    const relistButtonsProcessor = async (sessionEndTime) => {
        const targetClass = "x1lliihq x6ikm8r x10wlt62 x1n2onr6 xlyipyv xuxw1ft";
        const targetText = "Relist This Item";

        console.log("Starting to process 'Relist This Item' buttons...");

        let lastActivityTime = Date.now(); // Track the last time a button was found

        while (Date.now() < sessionEndTime) {
            const foundNewButtons = await tab.evaluate(async (targetClass, targetText, scrollDelay) => {
                let found = false;

                // Find all matching elements with the specified class and text
                const elements = Array.from(document.querySelectorAll(`span.${targetClass.split(' ').join('.')}`))
                    .filter(element =>
                        element.textContent.trim().toLowerCase() === targetText.toLowerCase() &&
                        !element.dataset.clicked // Skip already clicked buttons
                    );

                if (elements.length > 0) {
                    console.log(`Found ${elements.length} new button(s). Processing...`);
                    found = true;

                    for (let i = 0; i < elements.length; i++) {
                        const element = elements[i];
                        try {
                            // Scroll to the button and click it
                            element.scrollIntoView({ behavior: "instant", block: "center" });
                            element.click();
                            console.log(`Clicked button ${i + 1}/${elements.length}`);
                            element.setAttribute("data-clicked", "true"); // Mark as clicked
                        } catch (err) {
                            console.error(`Failed to click button ${i + 1}:`, err);
                        }
                    }

                    // Scroll down to potentially load more content
                    window.scrollBy(0, window.innerHeight);
                    await new Promise(resolve => setTimeout(resolve, scrollDelay));
                }

                return found;
            }, targetClass, targetText, scrollDelay);

            if (foundNewButtons) {
                lastActivityTime = Date.now(); // Reset inactivity timer
            } else {
                console.log("No new buttons found. Waiting before rechecking...");
                await new Promise(resolve => setTimeout(resolve, retryInterval));
            }

            // Check for inactivity timeout
            if (Date.now() - lastActivityTime > inactivityTimeout) {
                console.log("No activity for 8 seconds. Refreshing the page...");
                return; // Exit the current session to trigger a refresh
            }
        }

        console.log("Finished processing buttons for this session.");
    };

    try {
        const globalEndTime = Date.now() + totalRunDuration; // Calculate when the entire process should stop
        let sessionCount = 1;

        while (Date.now() < globalEndTime) {
            console.log(`Session ${sessionCount}: Navigating to ${targetUrl}...`);
            await tab.goto(targetUrl, { waitUntil: 'networkidle2' });

            console.log("Page loaded. Starting relisting process...");
            const sessionDuration = 60000; // 1-minute session duration
            const sessionEndTime = Math.min(globalEndTime, Date.now() + sessionDuration); // Ensure no overflow
            await relistButtonsProcessor(sessionEndTime);

            sessionCount++;

            if (Date.now() >= globalEndTime) {
                console.log("Total 3 minutes completed. Ending the process.");
                break;
            }

            console.log("Refreshing page for the next session...");
        }

        console.log("All sessions completed.");
    } catch (error) {
        console.error("An error occurred:", error);
    }
}




async function Unlist_Mark_Sold(tab) {
    const targetUrl = 'https://www.facebook.com/marketplace/you/selling?referral_surface=seller_hub&status[0]=OUT_OF_STOCK';
    const maxClicks = 25; // Maximum number of clicks before scrolling
    const clickDelay = 2000; // Delay between clicks in milliseconds
    const scrollDelay = 300; // Delay for scrolling
    const timeoutDuration = 10000; // 10 seconds timeout for finding new buttons

    console.log(`Navigating to target URL: ${targetUrl}`);

    await tab.goto(targetUrl, { waitUntil: 'networkidle2' });

    const processButtons = async () => {
        const buttonTexts = ["Mark as in stock", "Mark as available"];
        let clickedCount = 0;
        let lastButtonFoundTime = Date.now(); // Track the last time a button was found

        console.log("Processing 'Mark as in stock' or 'Mark as available' buttons...");

        while (clickedCount < maxClicks) {
            const foundNewButtons = await tab.evaluate(async (buttonTexts, clickDelay, maxClicks) => {
                let clicked = 0;

                for (const text of buttonTexts) {
                    // Find all matching elements with the specified text
                    const elements = Array.from(document.querySelectorAll('span'))
                        .filter(element =>
                            buttonTexts.includes(element.textContent.trim()) &&
                            !element.dataset.clicked // Skip already clicked buttons
                        );

                    for (let i = 0; i < elements.length; i++) {
                        if (clicked >= maxClicks) break;
                        const element = elements[i];

                        try {
                            // Scroll to the button and click it
                            element.scrollIntoView({ behavior: "instant", block: "center" });
                            element.click();
                            console.log(`Clicked button: ${element.textContent.trim()}`);
                            element.setAttribute("data-clicked", "true"); // Mark as clicked
                            clicked++;

                            // Wait for clickDelay
                            await new Promise(resolve => setTimeout(resolve, clickDelay));
                        } catch (err) {
                            console.error(`Failed to click button:`, err);
                        }
                    }
                }

                return clicked > 0; // Return true if at least one button was clicked
            }, buttonTexts, clickDelay, maxClicks); // Pass maxClicks explicitly here

            if (foundNewButtons) {
                lastButtonFoundTime = Date.now(); // Update last found button time
                clickedCount++;
            }

            const timeSinceLastButton = Date.now() - lastButtonFoundTime;

            if (timeSinceLastButton > timeoutDuration) {
                console.log("No new buttons found in the last 10 seconds. Exiting...");
                break;
            }

            if (clickedCount >= maxClicks) {
                console.log("Reached max clicks. Exiting...");
                break;
            }

            console.log("Scrolling down to search for more buttons...");
            await tab.evaluate(() => window.scrollBy(0, window.innerHeight));
            await new Promise(resolve => setTimeout(resolve, scrollDelay));
        }

        console.log("Finished processing buttons.");
    };

    try {
        console.log("Injecting script...");
        await processButtons();

        // Final task: Perform any cleanup or next actions here
        console.log("Processing complete. Final steps can be added here if necessary.");
        // No alert, just a log for clarity.
        console.log("Final task completed.");
    } catch (error) {
        console.error("An error occurred:", error);
    }
}








async function Need_Hide(tab) {
    try {
        console.log('Looking for the "Hide" button...');

        // Define the selector for the "Hide" button
        const hideButtonSelector = '//span[text()="Hide"]';

        const buttonFound = await tab.evaluate((selector) => {
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
        }, hideButtonSelector);

        if (buttonFound) {
            console.log('"Hide" button found. Clicking it...');
            await tab.evaluate((selector) => {
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
            }, hideButtonSelector);
            console.log('Successfully clicked the "Hide" button.');
        } else {
            console.log('"Hide" button not found. Skipping...');
        }
    } catch (error) {
        console.error(`Error during "Hide" button interaction: ${error.message}`);
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
    runAdsMultiplier
};
