console.log('Renderer script loaded!');
const { ipcRenderer } = require('electron');
// Ensure the `window.uploadedImages` arr
// Ensure the `window.uploadedImages` arr
// Ensure the `window.uploadedImages` arr

function updateAccountStatus(username, newStatus) {
    const tableRows = document.querySelectorAll('#accountsTable tbody tr');
    tableRows.forEach(row => {
        const usernameCell = row.querySelector('td:first-child');
        if (usernameCell && usernameCell.textContent.trim() === username) {
            const statusCell = row.querySelector('td:nth-child(3)');
            statusCell.textContent = newStatus;

            // Optional: Highlight rows based on status
            row.classList.remove('success', 'failed', 'processing', 'browser-closed');
            if (newStatus === 'Completed') {
                row.classList.add('success');
            } else if (newStatus === 'Failed') {
                row.classList.add('failed');
            } else if (newStatus === 'Processing') {
                row.classList.add('processing');
            } else if (newStatus === 'Browser Closed') {
                row.classList.add('browser-closed');
            }
        }
    });
}

ipcRenderer.on('update-account-status', (event, { username, status }) => {
    updateAccountStatus(username, status);
});




ipcRenderer.on('selected-files', (event, paths) => {
    const imageThumbnailsContainer = document.getElementById('imageThumbnails');
    const imagePathsList = document.getElementById('imagePathsList');
    const hiddenImagePaths = document.getElementById('hiddenImagePaths');

    // Ensure the `window.uploadedImages` array exists
    window.uploadedImages = window.uploadedImages || [];

    // Filter out duplicate paths
    const newPaths = paths.filter(filePath => !window.uploadedImages.includes(filePath));

    // Update the global `window.uploadedImages` array
    window.uploadedImages = [...window.uploadedImages, ...newPaths];

    // Render thumbnails for new images
    newPaths.forEach(filePath => {
        // Create image thumbnail
        const thumbnailDiv = document.createElement('div');
        thumbnailDiv.classList.add('thumbnail');

        const imageElement = document.createElement('img');
        imageElement.src = filePath;

        const removeButton = document.createElement('button');
        removeButton.classList.add('remove-img-btn');
        removeButton.textContent = 'X';
        removeButton.onclick = () => removeImage(thumbnailDiv, filePath);

        thumbnailDiv.appendChild(imageElement);
        thumbnailDiv.appendChild(removeButton);
        imageThumbnailsContainer.appendChild(thumbnailDiv);

        // Add path to visible list
        const pathItem = document.createElement('li');
        pathItem.textContent = filePath;
        imagePathsList.appendChild(pathItem);

        // Add path to hidden list
        const hiddenPathItem = document.createElement('li');
        hiddenPathItem.textContent = filePath;
        hiddenImagePaths.appendChild(hiddenPathItem);
        updateCounts();
    });

    // Save the updated list of uploaded images to persistent storage
    const userData = loadUserData();
    userData.imagePaths = window.uploadedImages;
    saveUserData(userData);
    updateCounts();
});




function removeImage(thumbnailDiv, filePath) {
    showWarningAlert('Are you sure you want to remove this image?', () => {
        thumbnailDiv.remove();

        // Remove the image path from the visible list
        const imagePathsList = document.getElementById('imagePathsList');
        const items = imagePathsList.querySelectorAll('li');
        items.forEach(item => {
            if (item.textContent === filePath) {
                item.remove();
            }
        });

        // Remove the image path from the hidden list
        const hiddenImagePaths = document.getElementById('hiddenImagePaths');
        const hiddenItems = hiddenImagePaths.querySelectorAll('li');
        hiddenItems.forEach(item => {
            if (item.textContent === filePath) {
                item.remove();
            }
        });

        // Update the uploadedImages array
        window.uploadedImages = window.uploadedImages.filter(image => image !== filePath);
        updateCounts();
    });
}


document.getElementById('removeAllImagesBtn').addEventListener('click', () => {
    showWarningAlert('Are you sure you want to remove all images?', () => {
        const imageThumbnailsContainer = document.getElementById('imageThumbnails');
        const imagePathsList = document.getElementById('imagePathsList');
        const hiddenImagePaths = document.getElementById('hiddenImagePaths');

        imageThumbnailsContainer.innerHTML = ''; // Clear thumbnails
        imagePathsList.innerHTML = ''; // Clear visible paths
        hiddenImagePaths.innerHTML = ''; // Clear hidden paths

        window.uploadedImages = []; // Reset image array
        updateCounts(); // Update counts
    });
});

// Load Data from Backend
ipcRenderer.on('load-data', (event, data) => {



    // Update fields in the UI
    document.getElementById('email').value = data.email || '';
    document.getElementById('password').value = data.password || '';
    document.getElementById('titles').value = (data.titles || []).join('\n');
    document.getElementById('price').value = data.price || '';
    document.getElementById('description').value = data.description || '';
    document.getElementById('tabCount').value = data.tabCount || 1;
    document.getElementById('locations').value = (data.locations || []).join('\n');
    document.getElementById('categorySelect').value = data.category || 'tools';
    document.getElementById('conditionSelect').value = data.condition || 'New';

    // If image paths exist, render them
    const imageThumbnailsContainer = document.getElementById('imageThumbnails');
    const imagePathsList = document.getElementById('imagePathsList');
    imageThumbnailsContainer.innerHTML = ''; // Clear current thumbnails
    imagePathsList.innerHTML = ''; // Clear current list

    (data.imagePaths || []).forEach(filePath => {
        // Create thumbnail and add to container
        const thumbnailDiv = document.createElement('div');
        thumbnailDiv.classList.add('thumbnail');

        const imageElement = document.createElement('img');
        imageElement.src = filePath;

        const removeButton = document.createElement('button');
        removeButton.classList.add('remove-img-btn');
        removeButton.textContent = 'X';
        removeButton.onclick = () => removeImage(thumbnailDiv, filePath);

        thumbnailDiv.appendChild(imageElement);
        thumbnailDiv.appendChild(removeButton);
        imageThumbnailsContainer.appendChild(thumbnailDiv);

        // Add path to list
        const listItem = document.createElement('li');
        listItem.textContent = filePath;
        imagePathsList.appendChild(listItem);
    });

    // Store the image paths globally
    window.uploadedImages = data.imagePaths || [];
});

document.addEventListener('DOMContentLoaded', () => {
    ipcRenderer.send('request-load-data'); // Request data when the UI is loaded
});



// Save Data
document.getElementById('saveDataButton').addEventListener('click', () => {
    const data = {
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        titles: document.getElementById('titles').value.trim().split('\n'),
        price: document.getElementById('price').value,
        description: document.getElementById('description').value,
        tabCount: parseInt(document.getElementById('tabCount').value, 10),
        imagePaths: window.uploadedImages || [],
        locations: document.getElementById('locations').value.trim().split('\n'),
        category: document.getElementById('categorySelect').value,
        condition: document.getElementById('conditionSelect').value,
        tags: document.getElementById('tags').value.trim().split(',').map(tag => tag.trim())
    };
    console.log("Tags being saved:", data.tags); // Log tags before saving
    ipcRenderer.send('save-data', data);
});

function showAlert(message) {
    const alertBox = document.getElementById('alertBox');
    const alertMessage = document.getElementById('alertMessage');

    alertMessage.textContent = message; // Set the alert message
    alertBox.style.display = 'block';  // Show the alert box
}

function closeAlert() {
    const alertBox = document.getElementById('alertBox');
    alertBox.style.display = 'none'; // Hide the alert box
}

// Handle Start Automation Button
document.getElementById('startAutomationBtn').addEventListener('click', async () => {
    const scriptSelection = document.getElementById('scriptSelection').value; // Turbo or SlowRun
    const loginType = document.querySelector('input[name="loginType"]:checked').value;
    const cookiesField = document.getElementById('cookies');
    const cookies = cookiesField.value.trim();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const titles = document.getElementById('titles').value.split('\n').filter(title => title.trim() !== '');
    const price = document.getElementById('price').value;
    const category = document.getElementById('categorySelect').value;
    const description = document.getElementById('description').value;
    const availability = document.getElementById('availabilitySelect').value;
    const condition = document.getElementById('conditionSelect').value;
    const tabCount = parseInt(document.getElementById('tabCount').value, 10);
    const imagePaths = window.uploadedImages || [];
    const locations = document.getElementById('locations').value.trim().split('\n');
    const tags = document.getElementById('tags').value.trim().split(',').map(tag => tag.trim());
    const doorDropOffChecked = document.getElementById('doorDropOff').checked;
    const hideFromFriendsChecked = document.getElementById('hideFromFriends').checked;
    const enableProxy = document.getElementById('enableProxy').checked;

    const cookiesWarning = document.getElementById('cookiesWarning');
    const startAutomationBtn = document.getElementById('startAutomationBtn');


    const proxyData = enableProxy
        ? {
            address: document.getElementById('proxyAddress').value,
            type: document.getElementById('proxyType').value,
            username: document.getElementById('proxyUsername').value || null,
            password: document.getElementById('proxyPassword').value || null,
        }
        : null;

    // Reset warnings and button state
    if (cookiesWarning) cookiesWarning.style.display = 'none';
    startAutomationBtn.textContent = "Processing...";
    startAutomationBtn.disabled = true;

    try {

        function showErrorModal(message) {
            // Check if modal already exists
            if (document.querySelector('.error-modal')) return;

            // Create the modal overlay
            const modal = document.createElement('div');
            modal.className = 'error-modal';

            // Create the modal content
            const modalContent = document.createElement('div');
            modalContent.className = 'error-modal-content';

            // Add the error message
            const errorMessage = document.createElement('p');
            errorMessage.textContent = message;

            // Add a dismiss button
            const dismissButton = document.createElement('button');
            dismissButton.id = 'closeErrorButton';
            dismissButton.textContent = 'Close';
            dismissButton.onclick = () => {
                document.body.removeChild(modal); // Remove modal on button click
            };

            // Append elements
            modalContent.appendChild(errorMessage);
            modalContent.appendChild(dismissButton);
            modal.appendChild(modalContent);

            // Append modal to body
            document.body.appendChild(modal);

            // Display modal
            modal.style.display = 'block';
        }


        // Validate cookies for login type
        if (loginType === 'cookies' && cookies === "") {
            cookiesWarning.style.display = 'block';
            return;
        }

        // Validate proxy settings
        if (enableProxy) {
            if (!proxyData.address) throw new Error('Proxy is enabled, but no proxy address is provided.');
            if (!['http', 'https', 'socks4', 'socks5'].includes(proxyData.type)) {
                throw new Error('Invalid proxy type selected.');
            }
        }

        // Tab count and image validation
        if (titles.length < tabCount || imagePaths.length < tabCount) {
            throw new Error(`You need at least ${tabCount} titles and ${tabCount} images to start automation.`);
        }

        if (loginType === 'bulkAccount') {
            // Fetch accounts for bulk automation
            const accounts = Array.from(document.querySelectorAll('#accountsTable tbody tr')).map(row => {
                const cells = row.querySelectorAll('td');
                return {
                    username: cells[0].textContent.trim(),
                    password: cells[1].textContent.trim(),
                };
            });

            if (accounts.length === 0) throw new Error("No accounts found in the Bulk Account table.");

            // Send bulk automation data
            const results = await ipcRenderer.invoke('start-bulk-automation', {
                accounts,
                browserLimit: parseInt(document.getElementById('browserLimit').value, 10),
                sharedData: {
                    titles,
                    price,
                    category,
                    description,
                    availability,
                    condition,
                    tabCount,
                    imagePaths,
                    locations,
                    tags,
                    doorDropOffChecked,
                    hideFromFriendsChecked,
                    enableProxy,
                    proxy: proxyData,
                },
                scriptType: scriptSelection, // Pass selected script type (Turbo or SlowRun)
            });

            // Update table with statuses
            results.forEach(result => {
                const row = Array.from(document.querySelectorAll('#accountsTable tbody tr'))
                    .find(r => r.querySelector('td').textContent.trim() === result.username);
                if (row) row.querySelector('td:nth-child(3)').textContent = result.status;
            });

            showErrorModal('Bulk automation completed!');
        } else {
            // Single account logic
            if (!email || !password) throw new Error("Email and password are required for single account automation.");

            await ipcRenderer.invoke(
                scriptSelection === 'beta_automation' ? 'run-beta-automation'
                    : scriptSelection === 'ads_multiplier' ? 'run-ads-multiplier'
                        : scriptSelection === 'relist_fb' ? 'run-relist-fb'
                            : scriptSelection === 'renew_fb' ? 'run-renew-fb'
                                : scriptSelection === 'delete_duplicate' ? 'run-delete-duplicate'
                                    : scriptSelection === 'draft_publisher' ? 'run-draft-publisher'
                                        : scriptSelection === 'draft_delete_auto' ? 'run-draft-delete-auto'
                                            : 'run-automation',
                {
                    loginType,
                    ...(loginType === 'cookies' && { cookies }), // Include cookies if loginType is cookies
                    ...(loginType === 'username' && { email, password }), // Include email and password for username login
                    ...(loginType === 'bulkAccount' && { accounts }), // Include accounts if loginType is bulkAccount
                    titles,
                    price,
                    description,
                    condition,
                    category,
                    availability,
                    tabCount,
                    imagePaths,
                    locations,
                    tags,
                    doorDropOffChecked,
                    hideFromFriendsChecked,
                    enableProxy,
                    proxy: proxyData,
                }
            );


            showErrorModal('Single account automation completed!');
        }
    } catch (error) {
        console.error('Automation error:', error);

        showErrorModal(error.message);
    } finally {
        // Reset button state
        startAutomationBtn.textContent = "Start Automation";
        startAutomationBtn.disabled = false;
    }
});



ipcRenderer.on('automation-done', () => {
    // Restore button state
    const startAutomationBtn = document.getElementById('startAutomationBtn');
    startAutomationBtn.textContent = "Start Automation";
    startAutomationBtn.disabled = false;
    console.log("Automation task completed or stopped, button reinstated.");
});

ipcRenderer.send('request-load-data');

// Countdown Timer
function startCountdown(expiredTime) {
    const countdownElement = document.getElementById('countdown');

    function updateCountdown() {
        const currentTime = Date.now();
        const timeLeft = expiredTime - currentTime;

        if (timeLeft <= 0) {
            countdownElement.textContent = "Expired!";
            clearInterval(intervalId);

            // Notify main process to close the window and show the warning popup
            ipcRenderer.send('time-expired');
            return;
        }

        // Calculate days, hours, minutes, and seconds
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

        // Format the countdown display
        countdownElement.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }

    const intervalId = setInterval(updateCountdown, 1000);
    updateCountdown(); // Initial call to display immediately
}

ipcRenderer.on('update-expiration-time', (event, data) => {
    const { expiredTime } = data;
    if (expiredTime) {
        // Update the countdown timer with the new expiration time
        startCountdown(expiredTime);
    }
});

ipcRenderer.on('expiration-time', (event, data) => {
    console.log("Expiration Time Response:", data); // Debugging log

    if (data.success) {
        startCountdown(data.expiredTime);
    } else {
        const countdownElement = document.getElementById('countdown');
        countdownElement.textContent = data.message || "Error loading expiration time.";
    }
});

ipcRenderer.send('get-expiration-time');

ipcRenderer.on('reset-automation-button', () => {
    const startAutomationBtn = document.getElementById('startAutomationBtn');
    console.log("Resetting Start Automation button...");
    startAutomationBtn.textContent = "Start Automation";
    startAutomationBtn.disabled = false;
});



ipcRenderer.send('request-counts');

ipcRenderer.on('update-counts', (event, counts) => {
    const { titleCount, locationCount, imageCount } = counts;

    // Update the DOM elements
    document.getElementById('titleCount').textContent = titleCount;
    document.getElementById('locationCount').textContent = locationCount;
    document.getElementById('imageCount').textContent = imageCount;
});

function updateCounts() {
    // Calculate title count
    const titles = document.getElementById('titles').value.trim().split('\n');
    const titleCount = titles.filter(title => title.trim() !== '').length;

    // Calculate location count
    const locations = document.getElementById('locations').value.trim().split('\n');
    const locationCount = locations.filter(location => location.trim() !== '').length;

    // Calculate image count
    const imageCount = window.uploadedImages ? window.uploadedImages.length : 0;

    // Update the count display elements
    document.getElementById('titleCount').textContent = titleCount;
    document.getElementById('locationCount').textContent = locationCount;
    document.getElementById('imageCount').textContent = imageCount;
}

document.addEventListener('DOMContentLoaded', () => {
    // Update counts on titles textarea change
    document.getElementById('titles').addEventListener('input', updateCounts);

    // Update counts on locations textarea change
    document.getElementById('locations').addEventListener('input', updateCounts);

    // Update counts whenever images are added or removed
    const uploadImageBtn = document.getElementById('uploadImageBtn');
    const removeAllImagesBtn = document.getElementById('removeAllImagesBtn');

    uploadImageBtn.addEventListener('click', () => {
        ipcRenderer.send('open-file');
        updateCounts();
    });

    ipcRenderer.on('selected-files', (event, paths) => {
        window.uploadedImages = paths;


        const userData = loadUserData();  // Load existing data
        userData.imagePaths = window.uploadedImages;  // Update image paths
        saveUserData(userData);
        updateCounts();
    });



    // Initialize counts on page load
    updateCounts();
});

ipcRenderer.on("load-user-data", (event, data) => {
    // Update placeholders dynamically
    document.getElementById("fullName").textContent = data.fullName;
    document.getElementById("userKey").textContent = data.key || "No Key Found";

    document.getElementById("whatsappNumber").textContent = data.whatsappNumber;

    // Convert expiredTime to a readable date
    if (data.expiredTime) {
        const expireDate = new Date(data.expiredTime).toLocaleString("en-US", {

        });
        document.getElementById("expireDate").textContent = expireDate;
    } else {
        document.getElementById("expireDate").textContent = "No expiration date found";
    }
});

ipcRenderer.on('console-log', (event, message) => {
    appendToCustomConsole(message, 'log'); // Append standard logs
});

ipcRenderer.on('console-error', (event, message) => {
    appendToCustomConsole(message, 'error'); // Append error logs
});

function appendToCustomConsole(message, type = 'log') {
    const logOutput = document.getElementById("logOutput");
    const logEntry = document.createElement("div");
    logEntry.textContent = message;

    // Style error logs differently
    if (type === 'error') {
        logEntry.style.color = 'red';
    }

    logOutput.appendChild(logEntry);
    logOutput.scrollTop = logOutput.scrollHeight; // Scroll to the bottom
}

function toggleProxySettings() {
    const proxySettings = document.getElementById('proxySettings');
    proxySettings.style.display = document.getElementById('enableProxy').checked ? 'block' : 'none';
}


function validateForm() {
    const enableProxy = document.getElementById('enableProxy').checked;
    if (enableProxy) {
        const proxyAddress = document.getElementById('proxyAddress').value;
        if (!proxyAddress) {
            alert('Please enter a proxy address.');
            return false;
        }
    }
    return true;
}

function toggleContainer(containerId, button) {
    // Hide all containers
    const containers = document.querySelectorAll('.data-container');
    containers.forEach(container => {
        container.classList.remove('active');
    });

    // Show the selected container
    const selectedContainer = document.getElementById(containerId);
    if (selectedContainer) {
        selectedContainer.classList.add('active');
    }

    // Remove 'active' class from all buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
        btn.classList.remove('active');
    });

    // Add 'active' class to the clicked button
    button.classList.add('active');
}

document.querySelectorAll('input, textarea').forEach(input => {
    input.disabled = false; // Ensure inputs are not disabled
});

function toggleSection(sectionToShowId) {
    // Hide all sections
    const sections = ['usernamePasswordFields', 'cookiesField', 'bulkAccountUI'];
    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            section.style.display = 'none';
        }
    });

    // Show the selected section
    const sectionToShow = document.getElementById(sectionToShowId);
    if (sectionToShow) {
        sectionToShow.style.display = 'block';
    }
}

function toggleLoginType() {
    const selectedType = document.querySelector('input[name="loginType"]:checked').value;
    if (selectedType === 'cookies') {
        toggleSection('cookiesField', ['usernamePasswordFields', 'cookiesField', 'bulkAccountUI']);
    } else if (selectedType === 'username') {
        toggleSection('usernamePasswordFields', ['usernamePasswordFields', 'cookiesField', 'bulkAccountUI']);
    } else if (selectedType === 'bulkAccount') {
        toggleSection('bulkAccountUI', ['usernamePasswordFields', 'cookiesField', 'bulkAccountUI']);
    }
}


function toggleBulkAccountUI() {
    const bulkAccountRadio = document.getElementById('bulkAccountRadio');
    if (bulkAccountRadio.checked) {
        toggleSection('bulkAccountUI');
    }
}

// Monitor the script selection dropdown and enforce tab limit
document.getElementById('scriptSelection').addEventListener('change', (e) => {
    const scriptSelection = e.target.value;
    const tabCountInput = document.getElementById('tabCount');

    if (scriptSelection === 'beta_automation') {
        tabCountInput.max = 60; // Set the max attribute for the input field
        if (tabCountInput.value > 60) {
            tabCountInput.value = 60; // Adjust the value to the maximum limit
        }
    } else {
        tabCountInput.removeAttribute('max'); // Remove the max limit for other scripts
    }
});

// Additional validation on blur event to ensure the limit
document.getElementById('tabCount').addEventListener('blur', (e) => {
    const scriptSelection = document.getElementById('scriptSelection').value;
    const tabCountInput = e.target;

    if (scriptSelection === 'beta_automation' && tabCountInput.value > 60) {
        tabCountInput.value = 60; // Adjust the value

        // Display the styled alert
        const alertBox = document.getElementById('tabCountAlert');
        const alertMessage = document.getElementById('tabCountAlertMessage');
        alertMessage.textContent = 'The maximum tabs for Slow Run - Ad Limit Automation is 60. Adjusted accordingly.';
        alertBox.style.display = 'block';

        // Handle "OK" button click
        document.getElementById('tabCountAlertOk').onclick = () => {
            alertBox.style.display = 'none'; // Hide the alert
        };
    }
});


document.getElementById('tags').addEventListener('blur', () => {
    const tagsInput = document.getElementById('tags');
    const tags = tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

    if (tags.length > 20) {
        alert('You can only enter up to 20 tags. The extra tags will be removed.');
        tagsInput.value = tags.slice(0, 20).join(', ');
    }
});

function openDownloadLink() {
    const { shell } = require('electron');
    shell.openExternal('https://akbotverse.blogspot.com/'); // Replace with your download link
}


// Get the Start Automation button
const startAutomationBtn = document.getElementById('startAutomationBtn2');
const loginForm = document.getElementById('loginForm'); // Assuming form has an ID

// Event listener for form submission
loginForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent default form submission behavior

    // Change button state to "Processing..." and disable it
    startAutomationBtn.textContent = "Processing...";
    startAutomationBtn.disabled = true;

    try {
        // Gather form data
        const formData = new FormData(loginForm);
        const data = Object.fromEntries(formData.entries());

        // Send data to backend automation function (using IPC in Electron)
        ipcRenderer.send('run-automation', data);

        // Listen for automation completion from the backend
        ipcRenderer.once('automation-completed', () => {
            // Log success or perform additional actions upon completion
            console.log("Automation task completed.");

            // Restore button state
            startAutomationBtn.textContent = "Start Automation";
            startAutomationBtn.disabled = false;
        });
    } catch (error) {
        console.error("Error during automation:", error);

        // Re-enable the button on error
        startAutomationBtn.textContent = "Start Automation";
        startAutomationBtn.disabled = false;
    }
});

function showWarningAlert(message) {
    const alertBox = document.getElementById('alertBox'); // Ensure this exists
    const alertMessage = document.getElementById('alertMessage');

    alertMessage.textContent = message;
    alertBox.style.display = 'block';
}

function closeAlert() {
    const alertBox = document.getElementById('alertBox');
    alertBox.style.display = 'none';
}



document.querySelectorAll('.remove-img-btn').forEach(button => {
    button.addEventListener('click', (event) => {
        const thumbnailDiv = event.target.closest('.thumbnail'); // Find the thumbnail div
        const filePath = thumbnailDiv.querySelector('img').src; // Get the image path

        // Use the custom warning popup
        showWarningAlert('Are you sure you want to remove this image?', () => {
            // On confirm, remove the image
            thumbnailDiv.remove();

            // Update the global uploadedImages array
            window.uploadedImages = window.uploadedImages.filter(image => image !== filePath);

            // Update counts
            updateCounts();
        });
    });
});


function showWarningAlert(message, onConfirm) {
    const alertBox = document.getElementById('alertBox'); // Modal container
    const alertMessage = document.getElementById('alertMessage'); // Message text
    const alertOkButton = document.getElementById('alertOk'); // "Yes" button
    const alertCancelButton = document.getElementById('alertCancel'); // "Cancel" button

    // Set the message in the modal
    alertMessage.textContent = message;

    // Display the modal
    alertBox.style.display = 'block';

    // Handle "Yes" button click
    alertOkButton.onclick = () => {
        alertBox.style.display = 'none'; // Hide the modal
        if (onConfirm) onConfirm(); // Execute the confirm action
    };

    // Handle "Cancel" button click
    alertCancelButton.onclick = () => {
        alertBox.style.display = 'none'; // Hide the modal
    };
}




function attachRemoveImageHandler() {
    const removeButtons = document.querySelectorAll('.remove-img-btn');

    removeButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const thumbnailDiv = event.target.closest('.thumbnail');
            const filePath = thumbnailDiv.querySelector('img').src;

            showWarningAlert('Are you sure you want to remove this image?', () => {
                thumbnailDiv.remove();

                // Update the global uploadedImages array
                window.uploadedImages = window.uploadedImages.filter(image => image !== filePath);

                // Update counts
                updateCounts();
            });
        });
    });
}

const contextMenu = document.getElementById('customContextMenu');
let activeInput = null;

// Show the context menu on right-click
document.querySelectorAll('input, textarea').forEach(input => {
    input.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        activeInput = this;

        // Get scroll position
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;

        // Use pageX/Y instead of clientX/Y to account for scroll position
        const mouseX = e.pageX;
        const mouseY = e.pageY;

        // Position menu and ensure it stays within viewport bounds
        const menuWidth = contextMenu.offsetWidth;
        const menuHeight = contextMenu.offsetHeight;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // Calculate position, keeping menu within viewport
        let posX = mouseX;
        let posY = mouseY;

        // Adjust if menu would extend beyond right edge
        if (posX + menuWidth > windowWidth + scrollX) {
            posX = mouseX - menuWidth;
        }

        // Adjust if menu would extend beyond bottom edge
        if (posY + menuHeight > windowHeight + scrollY) {
            posY = mouseY - menuHeight;
        }

        contextMenu.style.left = `${posX}px`;
        contextMenu.style.top = `${posY}px`;
        contextMenu.style.display = 'block';
    });
});

// Hide the context menu on click outside
document.addEventListener('click', () => {
    contextMenu.style.display = 'none';
});

// Perform the selected action
function performAction(action) {
    if (!activeInput) return;

    switch (action) {
        case 'copy':
            activeInput.select();
            document.execCommand('copy');
            break;

        case 'cut':
            // Copy selected text to clipboard and delete it from the field
            activeInput.select();
            document.execCommand('cut');
            break;

        case 'paste':
            navigator.clipboard.readText().then(text => {
                const start = activeInput.selectionStart;
                const end = activeInput.selectionEnd;

                // Replace selected text or insert at cursor
                activeInput.value =
                    activeInput.value.substring(0, start) +
                    text +
                    activeInput.value.substring(end);

                // Move the cursor after the pasted text
                activeInput.selectionStart = activeInput.selectionEnd = start + text.length;
            }).catch(err => {
                alert('Failed to paste: ' + err);
            });
            break;

        case 'delete':
            // Delete the selected text
            const start = activeInput.selectionStart;
            const end = activeInput.selectionEnd;
            activeInput.value =
                activeInput.value.substring(0, start) +
                activeInput.value.substring(end);

            // Reset cursor position after deletion
            activeInput.selectionStart = activeInput.selectionEnd = start;
            break;

        case 'undo':
            document.execCommand('undo');
            break;

        case 'redo':
            document.execCommand('redo');
            break;

        default:
            break;
    }

    // Hide the context menu after performing an action
    contextMenu.style.display = 'none';
}

function checkHeadlessAutomation() {
    const headlessCheck = document.getElementById('headlessCheck');
    if (headlessCheck.checked) {
        console.log("Headless automation enabled. Updating configuration...");
        // Add logic to enable headless automation in the backend or send a signal
        ipcRenderer.invoke('update-headless-mode', { headless: true });
    } else {
        console.log("Headless automation disabled.");
        // Add logic to disable headless automation
        ipcRenderer.invoke('update-headless-mode', { headless: false });
    }
}

document.getElementById('saveDataButton').addEventListener('click', function () {
    const successMessage = document.getElementById('successMessage');
    successMessage.classList.add('show');

    // Hide the success message after 3 seconds
    setTimeout(function () {
        successMessage.classList.remove('show');
    }, 3000);
});

function toggleConsole() {
    const consoleDiv = document.getElementById("customConsole");
    const toggleButton = document.getElementById("toggleConsole");
    const modal = document.getElementById("passwordModal");
    const passwordInput = document.getElementById("passwordInput");
    const passwordSubmit = document.getElementById("passwordSubmit");
    const passwordCancel = document.getElementById("passwordCancel");
    const errorPopup = document.getElementById("errorPopup");
    const errorMessage = document.getElementById("errorMessage");

    // Show the modal
    modal.style.display = "block";

    // Handle the Submit button
    passwordSubmit.onclick = function () {
        if (passwordInput.value === "White@901") {
            modal.style.display = "none"; // Hide the password modal
            passwordInput.value = ""; // Clear the input field

            // Toggle the visibility of the console
            if (consoleDiv.style.display === "none") {
                consoleDiv.style.display = "block";
                toggleButton.textContent = "Hide Logs";
            }
        } else {
            // Display the CSS-styled error popup
            showErrorPopup("Incorrect password!");
            passwordInput.value = ""; // Clear the input field
        }
    };

    // Handle the Cancel button
    passwordCancel.onclick = function () {
        modal.style.display = "none";
        passwordInput.value = ""; // Clear the input field
    };

    // Close the modal when clicking outside of it
    window.onclick = function (event) {
        if (event.target === modal) {
            modal.style.display = "none";
            passwordInput.value = ""; // Clear the input field
        }
    };

    // Handle Hide Logs
    if (consoleDiv.style.display === "block") {
        consoleDiv.style.display = "none";
        toggleButton.textContent = "Show Logs";
    }
}

// Function to show the CSS-styled error popup
function showErrorPopup(message) {
    const errorPopup = document.getElementById("errorPopup");
    const errorMessage = document.getElementById("errorMessage");

    errorMessage.textContent = message; // Set the error message
    errorPopup.style.display = "block"; // Show the popup
}

// Function to close the error popup
function closeErrorPopup() {
    const errorPopup = document.getElementById("errorPopup");
    errorPopup.style.display = "none"; // Hide the popup
}



// Override the default console.log function to capture logs
(function () {
    const originalConsoleLog = console.log;
    const logOutput = document.getElementById("logOutput");

    console.log = function (...args) {
        originalConsoleLog.apply(console, args);

        // Append the log message to the custom console
        const message = args.map(arg => (typeof arg === "object" ? JSON.stringify(arg, null, 2) : arg)).join(" ");
        const logEntry = document.createElement("div");
        logEntry.textContent = message;
        logOutput.appendChild(logEntry);

        // Scroll to the bottom of the log output
        logOutput.scrollTop = logOutput.scrollHeight;
    };
})();

function openVideoPopup() {
    const popup = document.getElementById('videoPopup');
    const iframe = document.getElementById('youtubeFrame');
    // Replace VIDEO_ID with your actual YouTube video ID
    iframe.src = 'https://www.youtube.com/embed/tkC-CkXk154?autoplay=1';
    popup.style.display = 'block';
}

function closeVideoPopup() {
    const popup = document.getElementById('videoPopup');
    const iframe = document.getElementById('youtubeFrame');
    iframe.src = ''; // Clear the source to stop the video
    popup.style.display = 'none';
}
