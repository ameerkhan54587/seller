def inject_custom_text(driver):
    custom_text_js = """
    (function() {
        // Check if the container already exists and remove it
        var existingContainer = document.getElementById('customTextContainer');
        if (existingContainer) {
            existingContainer.remove();
        }

        // Create a container for the custom text
        var container = document.createElement('div');
        container.id = 'customTextContainer';
        container.style.position = 'fixed';
        container.style.bottom = '10px';
        container.style.right = '10px';
        container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        container.style.color = 'white';
        container.style.padding = '10px';
        container.style.zIndex = '10000';
        container.style.fontFamily = 'Arial, sans-serif';
        container.style.fontSize = '14px';
        container.style.borderRadius = '10px';
        container.style.width = '220px';

        // Add the custom text with different styles
        container.innerHTML = `
            <p style="font-size: 16px; font-weight: bold;">Script Version: v110.2</p>
            <p style="font-size: 16px; font-weight: bold;">Last updated: 9 July 2024</p>
            <p><a href="https://drive.usercontent.google.com/download?id=1rRjfgKqg3sSMIkMAGHsDmMEUHA6_3F65&export=download&authuser=0&confirm=t&uuid=68ac38d2-1186-4bca-a005-4d315c900b5e&at=APZUnTUt9YSqDRFfpcU2pFfatMw_:1719896643998" style="color: #00ffff;" target="_blank">Download Latest Bot v3.0</a></p>
            <p style="font-size: 12px; margin-top: 10px;">Presented by AK Universe, WhatsApp at +92 306 3294901.</p>
        `;

        // Append the container to the body
        document.body.appendChild(container);

        // Add the custom styles and processing animation
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0; }
            }

            .processing {
                position: fixed;
                top: 40px;
                left: 0;
                width: 100%;
                background: linear-gradient(90deg, #333, #555);
                color: #fff;
                padding: 40px;
                font-size: 20px;
                font-family: Arial, sans-serif;
                text-align: center;
                border-bottom: 3px solid #444;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
            }

            .processing span {
                margin-left: 10px;
                display: inline-block;
                width: 12px;
                height: 12px;
                background-color: #fff;
                border-radius: 50%;
                animation: blink 1s infinite;
            }

            .processing span:nth-child(2) {
                animation-delay: 0.2s;
            }

            .processing span:nth-child(3) {
                animation-delay: 0.4s;
            }
        `;
        document.head.appendChild(style);

        // Create and add processing animation
        const processing = document.createElement('div');
        processing.className = 'processing';
        processing.innerHTML = 'Powered by AK Universe. Parallel processing while you relax.<span></span><span></span><span></span>';
        document.body.appendChild(processing);
    })();
    """
    driver.execute_script(custom_text_js)


def configure_chrome_options():
    chrome_options = webdriver.ChromeOptions()
    chrome_options.add_argument("--disable-notifications")
    chrome_options.add_argument("--no-first-run")
    chrome_options.add_argument("--disable-extensions")
    chrome_options.add_argument("--disable-autofill")
    chrome_options.add_argument("--enable-resource-prefetching")
    chrome_options.add_argument("--disable-popup-blocking")
    chrome_options.add_argument("--no-first-run")
    chrome_options.add_argument("--disable-web-security")
    chrome_options.add_argument("--no-default-browser-check")
    #chrome_options.add_argument("--disable-speech-api")
    #chrome_options.add_argument("--disable-hang-monitor")
    #chrome_options.add_argument("--disable-client-side-phishing-detection")
    chrome_options.add_argument("--disable-sync")
    chrome_options.add_argument("--start-maximized")
    return chrome_options

def initialize_chrome_driver(chrome_options):
    chromedriver_path = os.path.join(os.getcwd(), 'chromedriver-win32', 'chromedriver.exe')
    service = ChromeService(executable_path=chromedriver_path)
    driver = webdriver.Chrome(service=service, options=chrome_options)
   
    return driver

def login_to_facebook(driver, selected_option):
    inject_custom_text(driver)  # Inject before login page loads

    if selected_option == "Normal Facebook":
        driver.get("https://akuniverse.github.io/AKUniverse/Plan-reseller.html")
        time.sleep(1)
        driver.get("https://www.facebook.com/login/")
        inject_custom_text(driver)  # Inject after login page loads

        # JavaScript code to fill email, password and click login button
        js_login = """
        // Set email and password values
        var email = arguments[0];
        var password = arguments[1];

        // Find and set the email input field
        var emailInput = document.querySelector('input[name="email"]');
        if (emailInput) {
            emailInput.value = email;
        } else {
            console.log("Email input not found.");
        }

        // Find and set the password input field
        var passwordInput = document.querySelector('input[name="pass"]');
        if (passwordInput) {
            passwordInput.value = password;
        } else {
            console.log("Password input not found.");
        }

        // Find the login button and simulate a click
        var loginButton = document.querySelector('button[name="login"]');
        if (loginButton) {
            loginButton.click();
        } else {
            console.log("Login button not found.");
        }
        """
        # Execute the JavaScript code with email and password as arguments
        driver.execute_script(js_login, user_data["email"], user_data["password"])
        inject_custom_text(driver)  # Inject after login

    elif selected_option == "Opera Facebook":
        driver.get("https://akuniverse.github.io/AKUniverse/Plan-reseller.html")
        time.sleep(1)
        driver.get("https://www.facebook.com/login.php?skip_api_login=1&api_key=449838951736891&kid_directed_site=0&app_id=449838951736891&signed_next=1&next=https%3A%2F%2Fwww.facebook.com%2Fv2.12%2Fdialog%2Foauth%2Foauth%3Fresponse_type%3Dcode%26client_id%3D449838951736891%26redirect_uri%3Dhttps%253A%252F%252Fauth.opera.com%252Faccount%252Fsocial%252Fv4%252Fcallback%26scope%3Demail%26state%3DUWF8PvKkASQ6pfdptiLg6NIuRufr4U%26ret%3Dlogin%26fbapp_pres%3D0%26logger_id%3Db3aa3710-abfa-4798-b8ad-8e7d1eccc96c%26tp%3Dunspecified&cancel_url=https%3A%2F%2Fauth.opera.com%2Faccount%2Fsocial%2Fv4%252Fcallback%3Ferror%3Daccess_denied%26error_code%3D200%26error_description%3DPermissions%2Berror%26error_reason%3Duser_denied%26state%3DUWF8PvKkASQ6pfdptiLg6NIuRufr4U%23_%3D_&display=page&locale=en_GB&pl_dbl=0")
        inject_custom_text(driver)  # Inject after login page loads
        driver.execute_script(js_login, user_data["email"], user_data["password"])
        inject_custom_text(driver)  # Inject after login

    elif selected_option == "Cookies Access Token":
        driver.get("https://akuniverse.github.io/AKUniverse/Plan-reseller.html")
        inject_custom_text(driver)  # Inject before loading the main page
        time.sleep(1)
        driver.get("https://www.facebook.com")
        inject_custom_text(driver) 


def set_cookies(driver):
    cookies = cookie_entry.get("1.0", tk.END).strip()
    if cookies:
        cookies = [cookie.strip() for cookie in cookies.split(';')]
        for cookie in cookies:
            if '=' in cookie:  # Check if '=' exists in the cookie
                name, value = cookie.split('=', 1)
                # Setting the domain is necessary to avoid the InvalidCookieDomainException
                driver.add_cookie({'name': name, 'value': value, 'domain': '.facebook.com'})

def create_item(driver, item_title, available_image_paths, uploaded_images):
    inject_custom_text(driver)  # Inject before creating the item
    driver.execute_script("window.open('about:blank', '_blank');")
    window_handles = driver.window_handles
    driver.switch_to.window(window_handles[-1])
    driver.get("https://www.facebook.com/marketplace/create/item")

    inject_custom_text(driver) 

    try:
        # Fill the title input field
        fill_input_by_label(driver, 'Title', item_title)

        # Fill the price input field
        fill_input_by_label(driver, 'Price', price_entry.get())
    except TimeoutException:
        print("Title and Price not Found, Skipping Process.")

    available_image_paths = [path for path in available_image_paths if path not in uploaded_images]
    if available_image_paths:
        random_image_path = random.choice(available_image_paths)
        uploaded_images.add(random_image_path)
        try:
            image_input = WebDriverWait(driver, 5).until(
                EC.presence_of_element_located((By.XPATH, "//input[@type='file']"))
            )
            image_input.send_keys(random_image_path)
        except TimeoutException:
            print("Image not found. Skipping the process.")
    else:
        print("No more images to upload.")
        return

    moredetail_js_code = """
    function clickMoreDetailsUnique() {
      // Target text to search for, in lowercase
      const targetText = 'more details';

      // Find the span element containing the text "More details" (case-insensitive)
      const spanElement = Array.from(document.querySelectorAll('span')).find(el => el.textContent.trim().toLowerCase() === targetText);

      // Check if the span element was found
      if (spanElement) {
        console.log('Span element found.');

        // Scroll the span element into view and click it
        spanElement.scrollIntoView({ behavior: 'auto', block: 'center' });
        spanElement.click();

        // Print a message in the console
        console.log('Span element clicked.');
      } else {
        console.log('Span element not found.');
      }
    }

    // Initial attempt to click the span element
    clickMoreDetailsUnique();
    """

    try:
        driver.execute_script(moredetail_js_code)
        print("JavaScript executed to find and click the 'More details' button")
    except (TimeoutException, NoSuchElementException):
        print("Condition or New button not found. Skipping other processes.")

def fill_input_by_label(driver, label_text, value, timeout=5):
    # Construct JavaScript code with proper string interpolation
    js_code = f"""
    function fillInputByLabel(text, value) {{
        var xpath = `//span[text()='${{text}}']`;
        var span = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (span) {{
            var inputField = span.closest('label').querySelector('input[type="text"]');
            if (inputField) {{
                inputField.scrollIntoView({{ behavior: 'auto', block: 'center' }}); // Scroll into view
                inputField.select(); // Select any existing text
                inputField.value = ''; // Clear existing value
                document.execCommand('insertText', false, value); // Simulate typing
                var event = new Event('input', {{ bubbles: true }});
                inputField.dispatchEvent(event);
                return inputField.value === value;
            }} else {{
                console.log(`Input field not found for label: ${{text}}`);
                return false;
            }}
        }} else {{
            console.log(`Span with text "${{text}}" not found`);
            return false;
        }}
    }}

    return fillInputByLabel("{label_text}", "{value}");
    """

    for attempt in range(3):  # Retry up to 3 times
        try:
            # Wait for the span with the specified label text to be visible
            WebDriverWait(driver, timeout).until(
                EC.visibility_of_element_located((By.XPATH, f"//span[text()='{label_text}']"))
            )
            
            # Execute the JavaScript code
            success = driver.execute_script(js_code)
            if success:
                return True
        except Exception as e:
            print(f"Attempt {attempt + 1} failed: {e}")
        
    return False


def select_category(driver):
    js_code = """
    // Function to find an element by text content (case-insensitive)
    function findElementByTextContent(tag, text) {
      const elements = document.querySelectorAll(tag);
      const lowerCaseText = text.toLowerCase();
      console.log(`Searching for elements with tag: ${tag}`);
      for (let element of elements) {
        const elementText = element.textContent.trim().toLowerCase();
        console.log(`Checking element with text: "${elementText}"`);
        if (elementText === lowerCaseText) {
          console.log(`Element found with matching text: "${text}"`);
          return element;
        }
      }
      return null;
    }

    // Function to click an element and handle visibility check with timeout
    function clickElementWhenVisible(tag, text, timeout = 2000) { // Reduced timeout to 2 seconds
      return new Promise((resolve, reject) => {
        const observerConfig = { childList: true, subtree: true };
        let observer;
        let timeoutId;

        const callback = function(mutationsList, obs) {
          const element = findElementByTextContent(tag, text);
          if (element && element.offsetParent !== null) { // Check if element is visible
            console.log(`Found and clicking element with text "${text}"`);
            element.scrollIntoView({ behavior: 'auto', block: 'center' }); // Scroll to element
            element.click();
            if (observer) {
              observer.disconnect(); // Disconnect observer after clicking
            }
            clearTimeout(timeoutId); // Clear timeout if element is found
            resolve();
          }
        };

        observer = new MutationObserver(callback);
        observer.observe(document.body, observerConfig);

        // Set timeout to wait for element visibility
        timeoutId = setTimeout(() => {
          console.log(`Timeout reached while waiting for element with text "${text}"`);
          observer.disconnect(); // Disconnect observer on timeout
          reject(new Error(`Timeout reached while waiting for element with text "${text}"`));
        }, timeout);

        // Initial check in case the element is already present
        callback();
      });
    }

    // Main execution
    // Determine which script to use based on the presence of a specific input element
    var categoryInput = document.querySelector('input[aria-label="Category"]');

    if (categoryInput) {
      // Input element found, use the second script logic
      console.log('Input element with aria-label "Category" found.');
      categoryInput.select();
      document.execCommand('insertText', false, 'Bedroom Furniture Sets');

      var inputEvent = new Event('input', { bubbles: true });
      categoryInput.dispatchEvent(inputEvent);

      console.log('Text "bedroom" entered successfully.');

      setTimeout(() => {
        var spanElement = Array.from(document.querySelectorAll('span')).find(span => span.textContent.trim().toLowerCase() === 'bedroom furniture sets'.toLowerCase());

        if (spanElement) {
          spanElement.click();
          console.log('Clicked on "Bedroom Furniture Sets" successfully.');
        } else {
          console.log('Span element with text "Bedroom Furniture Sets" not found.');
        }
      }, 1); // Small delay to allow for the dropdown to populate
    } else {
      // Input element not found, use the first script logic
      console.log('Input element with aria-label "Category" not found. Using first script logic.');

      const categorySpan = findElementByTextContent('span', 'Category');
      if (categorySpan) {
        console.log('Found span with text "Category":', categorySpan);
        clickElementWhenVisible('span', 'Category')
          .then(() => {
            // Wait for "Furniture" to become visible and click it
            return clickElementWhenVisible('span', 'Furniture');
          })
          .then(() => {
            console.log('"Furniture" clicked successfully.');
          })
          .catch((error) => {
            console.error('Error:', error);
          });
      } else {
        console.log('Span element with text "Category" not found.');
      }
    }
    """

    try:
        # Execute JavaScript code
        driver.execute_script(js_code)
        print("JavaScript executed for selecting category")
    except Exception as e:
        # Handle JavaScript execution error
        print(f"Error executing JavaScript: {str(e)}")


def select_condition(driver):
    # JavaScript code to find and click the Condition and New buttons
    js_code = """
    // Function to find and click an element by text
    function findElementByText(tag, text) {
      const elements = document.querySelectorAll(tag);
      for (let element of elements) {
        if (element.textContent.trim() === text) {
          console.log(`Found element with text "${text}":`, element);
          return element;
        }
      }
      return null;
    }

    // Function to scroll to an element and then click it
    function scrollToAndClickElement(element) {
      element.scrollIntoView({ behavior: 'auto', block: 'center' });
      element.click();
      console.log('Clicked element:', element);
    }

    // Function to search for span elements containing the text "New" and click on the first one found
    function findAndClickSpanContainingText(text) {
      var elements = document.querySelectorAll('span');
      var results = [];
      elements.forEach(element => {
        if (element.textContent.trim() === text) {
          results.push(element);
          // Add a border to highlight the element
          element.style.border = "2px solid red";
          // Click the element
          element.click();
        }
      });
      return results;
    }

    // Function to observe changes in the DOM and click "New" when it appears
    function observeForNewElement() {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            var newElements = findAndClickSpanContainingText("New");
            if (newElements.length > 0) {
              console.log(newElements);
              observer.disconnect(); // Stop observing once the element is found and clicked
            }
          }
        });
      });

      observer.observe(document.body, { childList: true, subtree: true });
    }

    // Find and click the element with the text "Condition"
    const conditionElement = findElementByText('span', 'Condition');
    if (conditionElement) {
      scrollToAndClickElement(conditionElement);
      console.log('Clicked element with text "Condition"');

      // Observe the DOM for the "New" element to appear
      observeForNewElement();
    } else {
      console.log('Element with text "Condition" not found.');
    }
    """
    try:
        driver.execute_script(js_code)
        print("JavaScript executed to find and click the Condition and New buttons")
    except TimeoutException:
        print("Condition or New button not found. Skipping other processes.")

 

def add_description(driver):
    description = description_entry.get("1.0", "end-1c").replace("'", "\\'").replace("\n", "\\n")  # Escape single quotes and new lines
    js_code = f"""
    var xpath = "//label[@aria-label='Description']";
    var label = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    if (label) {{
        var inputField = label.querySelector('input[type="text"], textarea'); // To cover textareas if any
        if (inputField) {{
  
            inputField.select(); // Select any existing text
            document.execCommand('insertText', false, '{description}'); // Simulate typing
            var event = new Event('input', {{ bubbles: true }});
            inputField.dispatchEvent(event);
        }} else {{
            console.log('Input field not found');
        }}
    }} else {{
        console.log('Label with aria-label "Description" not found');
    }}
    """
    try:
        driver.execute_script(js_code)
        print("JavaScript executed to fill the description")
    except (TimeoutException, NoSuchElementException) as e:
        print(f"Description field not found. Skipping the process. Error: {e}")

def set_availability(driver):
    if availability_checkbox_state.get():  # Assuming availability_checkbox_state is defined and callable
        js_code = """
        // Function to find an element by text content
        function findElementByTextContent(tag, text) {
          const elements = document.querySelectorAll(tag);
          for (let element of elements) {
            if (element.textContent.trim().toLowerCase() === text.toLowerCase()) {
              return element;
            }
          }
          return null;
        }

        // Function to click an element and handle visibility check
        function clickElementWhenVisible(tag, text) {
          return new Promise((resolve, reject) => {
            const observerConfig = { childList: true, subtree: true };
            let observer;

            const callback = function(mutationsList, obs) {
              const element = findElementByTextContent(tag, text);
              if (element && element.offsetParent !== null) { // Check if element is visible
                console.log(`Found and clicking element with text "${text}"`);
                element.click();
                if (observer) {
                  observer.disconnect(); // Disconnect observer after clicking
                }
                resolve();
              }
            };

            observer = new MutationObserver(callback);
            observer.observe(document.body, observerConfig);

            // Initial check in case the element is already present
            callback();
          });
        }

        // Main execution
        // Find and click the "Availability" span element
        const availabilitySpan = findElementByTextContent('span', 'Availability');
        if (availabilitySpan) {
          console.log('Found span with text "Availability":', availabilitySpan);
          clickElementWhenVisible('span', 'Availability')
            .then(() => {
              // Wait for "List as In Stock" to become visible and click it
              return clickElementWhenVisible('span', 'List as In Stock');
            })
            .then(() => {
              console.log('"List as In Stock" clicked successfully.');
            })
            .catch((error) => {
              console.error('Error:', error);
            });
        } else {
          console.log('Span element with text "Availability" not found.');
        }
        """

        try:
            driver.execute_script(js_code)
            print("JavaScript executed for setting availability")
        except Exception as e:
            print(f"Error executing JavaScript: {str(e)}")
            print("Skipping the process.")
    else:
        print("Availability checkbox state is False. Skipping availability-related tasks.")

def set_visibility(driver):
    if hide_from_friends_checkbox_var.get():
        try:
            hide_from_friends_elem = driver.find_element(By.XPATH, '//span[contains(text(),"Hide from friends")]')
            driver.execute_script("arguments[0].click();", hide_from_friends_elem)
        except NoSuchElementException:
            print("Hide from friends option not found. Skipping...")

    if door_dropoff_checkbox_var.get():
        try:
            door_dropoff_elem = driver.find_element(By.XPATH, '//span[text()="Door pickup"]')
            driver.execute_script("arguments[0].click();", door_dropoff_elem)
        except NoSuchElementException:
            print("Door drop-off option not found. Skipping...")

def get_random_location(remaining_locations):
    if remaining_locations:
        random.shuffle(remaining_locations)
        location = remaining_locations.pop()   # Remove the selected location
        return location
    else:
        return ""


def set_location(driver, all_locations):
    js_script = """
    var xpath = "//span[text()='Location']";
    var span = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    if (span) {
        var inputField = span.closest('div').querySelector('input[type="text"]');
        if (inputField) {
            inputField.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' }); // Smooth scroll to the input field
      
            inputField.select(); // Select any existing text
            document.execCommand('insertText', false, arguments[0]); // Simulate typing
            var event = new Event('input', { bubbles: true });
            inputField.dispatchEvent(event);
        } else {
            console.log('Input field not found');
        }
    } else {
        console.log('Span with text "Location" not found');
    }
    """

    max_attempts = 2
    location_set = False

    if not hasattr(set_location, "remaining_locations") or not set_location.remaining_locations:
        set_location.remaining_locations = all_locations.copy()
        random.shuffle(set_location.remaining_locations)  # Shuffle the locations list
        set_location.tried_locations = []

    while not location_set:
        if not set_location.remaining_locations:
            # If all locations have been tried, reshuffle the tried locations
            set_location.remaining_locations = set_location.tried_locations.copy()
            random.shuffle(set_location.remaining_locations)
            set_location.tried_locations = []

        location = set_location.remaining_locations.pop(0)  # Get the next random location
        set_location.tried_locations.append(location)

        attempts = 0
        while attempts < max_attempts and not location_set:
            try:
                driver.execute_script(js_script, location)

                matching_location = WebDriverWait(driver, 5).until(
                    EC.element_to_be_clickable((By.XPATH, '//ul[@role="listbox"]//li[1]'))
                )
                matching_location.click()
                location_set = True

            except TimeoutException:
                attempts += 1
                print(f"Location element not found, retrying... (Attempt {attempts}/{max_attempts})")
                if attempts >= max_attempts:
                    print(f"Max attempts reached for location '{location}'. Trying next location.")
                    break

            if not location_set and attempts < max_attempts:
                try:
                    next_button = WebDriverWait(driver, 5).until(
                        EC.presence_of_element_located((By.XPATH, '//span[contains(text(),"Next")]'))
                    )
                    driver.execute_script("arguments[0].click();", next_button)
                    print("Clicked on Next.")

                    if location:
                        try:
                            driver.execute_script(js_script, location)

                            matching_location = WebDriverWait(driver, 5).until(
                                EC.element_to_be_clickable((By.XPATH, '//ul[@role="listbox"]//li[1]'))
                            )
                            matching_location.click()
                            location_set = True

                        except TimeoutException:
                            print("Next button not found. Cannot proceed without location.")
                            attempts += 1
                            if attempts >= max_attempts:
                                print(f"Max attempts reached for location '{location}'. Trying next location.")
                                break
                except Exception as e:
                    print(f"An error occurred: {str(e)}. Retrying... (Attempt {attempts}/{max_attempts})")
                    attempts += 1
                    if attempts >= max_attempts:
                        print(f"Max attempts reached for location '{location}'. Trying next location.")
                        break

    if not location_set:
        print("Unable to set location after maximum attempts.")


def save_draft(driver, window_handles, tabs_data):
    current_tab_index = 1
    
    while current_tab_index < len(window_handles):
        driver.switch_to.window(window_handles[current_tab_index])
        
        try:
            js_click_save_draft = """
            const buttons = document.querySelectorAll('span');
            for (let button of buttons) {
                if (button.textContent.toLowerCase().includes('save draft'.toLowerCase())) {
                    console.log('Clicking on:', button);
                    button.click();
                    break;
                }
            }
            """
            driver.execute_script(js_click_save_draft)
            print("Executed script to save draft.")
        except Exception as e:
            print(f"Error executing save draft script: {e}")

        # Sleep for 1 second before moving to the next tab
        time.sleep(1)

        # Move to the next tab
        current_tab_index += 1
        if current_tab_index < len(window_handles):
            driver.switch_to.window(window_handles[current_tab_index])

    print("Completed Save draft on all tabs.")

def close_all_tabs_except_first(driver):
    
    # Get all window handles
    window_handles = driver.window_handles

    # Close all tabs except the first one
    for handle in window_handles[1:]:
        driver.switch_to.window(handle)
        driver.close()

    # Switch to the first window handle
    driver.switch_to.window(driver.window_handles[0])
    driver.get("https://www.facebook.com/marketplace/you/selling?state=DRAFT")
    print("Closed all tabs except the first one and navigated to the drafts page.")


def handle_continue_buttons(driver):
    js_handle_continue_buttons = """
    let lastHeight = 0;
    let newHeight = 0;
    let isScrolling = false;
    let checkingComplete = false;
    let scrollInterval = 100; // Interval between scrolls in milliseconds
    let maxIdleTime = 5000; // Maximum idle time before stopping scrolling
    let idleTime = 0; // Idle time counter
    let openedTabs = []; // Array to store references to opened tabs
    window.continueButtonsTaskCompleted = false; // Global flag

    // Function to find and highlight "Continue" buttons
    function highlightContinueButtons() {
        const continueButtons = document.querySelectorAll('span.x1lliihq.x6ikm8r.x10wlt62.x1n2onr6.xlyipyv.xuxw1ft');
        const continueButtonsFiltered = Array.from(continueButtons).filter(button => button.textContent.trim() === 'Continue');
        continueButtonsFiltered.forEach(button => button.style.backgroundColor = 'yellow');
        console.log(`Number of "Continue" buttons: ${continueButtonsFiltered.length}`);
        return continueButtonsFiltered;
    }

    // Function to check if the page is still loading
    function isPageLoading() {
        return document.querySelector('[aria-label="Loading..."][role="status"][data-visualcompletion="loading-state"]') !== null;
    }

    // Function to scroll the page
    function autoScroll() {
        if (!isScrolling) {
            isScrolling = true;
            window.scrollBy(0, 1000); // Scroll down by 1000 pixels
            setTimeout(checkHeight, scrollInterval); // Wait and then check height
        }
    }

    // Function to check if the page height changes or if loading is complete
    function checkHeight() {
        newHeight = document.body.scrollHeight;
        if (newHeight !== lastHeight) {
            lastHeight = newHeight;
            idleTime = 0; // Reset idle time if height changes
            isScrolling = false;
            autoScroll(); // Continue scrolling
        } else {
            idleTime += scrollInterval;
            if (!isPageLoading() || idleTime >= maxIdleTime) {
                isScrolling = false;
                checkingComplete = true;
                const buttons = highlightContinueButtons(); // Highlight buttons one last time and get them
                openButtonsInNewTabs(buttons);
            } else {
                isScrolling = false;
                autoScroll(); // Continue scrolling if page is still loading
            }
        }
    }

    // Function to open buttons in new tabs
    function openButtonsInNewTabs(buttons) {
        if (!isPageLoading()) {  // Only proceed if the page is not loading
            buttons.forEach((button, index) => {
                setTimeout(() => {
                    const parentAnchor = button.closest('a');
                    if (parentAnchor) {
                        const newTab = window.open(parentAnchor.href, '_blank');
                        if (newTab) {
                            openedTabs.push(newTab);
                            console.log(`Tab ${openedTabs.length} opened: ${parentAnchor.href}`);
                        } else {
                            console.log("Popup blocked. Please allow popups for this site.");
                        }
                    } else {
                        console.log("No parent anchor found for a Continue button.");
                    }
                    if (index === buttons.length - 1) {
                        console.log(`Total buttons processed: ${buttons.length}`);
                        focusNextTab(0); // Start focusing on the first tab
                    }
                }, index * 100); // Delay of 0.1 seconds between each click to avoid popup blocking
            });
        }
    }

    // Function to focus on the next tab
    function focusNextTab(tabIndex) {
        if (tabIndex < openedTabs.length) {
            openedTabs[tabIndex].focus();
            setTimeout(() => {
                focusNextTab(tabIndex + 1); // Move to the next tab after 1 second
            }, 1000); // 1-second delay before moving to the next tab
        } else {
            console.log('Finished focusing on all opened tabs.');
            window.continueButtonsTaskCompleted = true; // Set completion flag
        }
    }

    // Start auto scrolling
    autoScroll();

    // Create a MutationObserver to watch for changes in the DOM
    const observer = new MutationObserver((mutationsList, observer) => {
        if (!checkingComplete) {
            highlightContinueButtons();
        }
    });

    // Start observing the document for changes
    observer.observe(document.body, { childList: true, subtree: true });
    """

    driver.execute_script(js_handle_continue_buttons)
    print("Executed script to handle 'Continue' buttons.")


def publish_item(driver, window_handles, tabs_data):
    current_tab_index = 1
    
    while current_tab_index < len(window_handles):
        driver.switch_to.window(window_handles[current_tab_index])
        
        try:
            # Execute JavaScript to click the 'Next' button or directly click 'Publish' if 'Next' not found
            js_click_next_and_publish = """
            var nextButton = document.evaluate("//span[contains(text(),'Next')]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            var publishButton = document.evaluate("//span[contains(text(),'Publish')]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            
            if (nextButton) {
                nextButton.click();
                console.log("Clicked 'Next' button");
                
                // Function to wait for the 'Publish' button to become visible and click it
                function waitForPublishButton() {
                    var publishButton = document.evaluate("//span[contains(text(),'Publish')]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
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
                throw 'Buttons not found';
            }
            """
            
            # Retry mechanism
            retry_attempts = 3
            while retry_attempts > 0:
                try:
                    driver.execute_script(js_click_next_and_publish)
                    print(f"Clicked 'Next' and 'Publish' on tab {current_tab_index + 1}")
                    break
                except TimeoutException:
                    print(f"'Next' or 'Publish' button not found on tab {current_tab_index + 1}. Retrying...")
                    retry_attempts -= 1
                    
            
            if retry_attempts == 0:
                raise TimeoutException("'Next' or 'Publish' button not found after retries.")
        
        except TimeoutException as e:
            print(f"Error: {e}")
        
        # Move to the next tab
        current_tab_index += 1
        if current_tab_index < len(window_handles):
            driver.switch_to.window(window_handles[current_tab_index])

    print("Completed publishing items on all tabs.")
        
# Main automation logic
def fb_new_id():
    save_user_data()

    run_button.config(text="Processing Task...", state=tk.DISABLED, bg='#777', fg='orange')
    root.update_idletasks()
    root.after(1000, task_completed)

    chrome_options = configure_chrome_options()
    driver = initialize_chrome_driver(chrome_options)

    num_iterations = int(iterations_entry.get()) if iterations_entry.get().isdigit() else 3
    selected_option = selected_fblink.get()
    cookies_str = cookie_entry.get("1.0", "end-1c")

    login_to_facebook(driver, selected_option)
    set_cookies(driver)

    # Inject custom text overlay
    inject_custom_text(driver)

    # Define and initialize tabs_data
    tabs_data = list(zip(user_data["item_titles"], image_paths))[:num_iterations]
    uploaded_images = set()

    for i, (item_title, _) in enumerate(tabs_data):
        create_item(driver, item_title, image_paths, uploaded_images)
        inject_custom_text(driver)  # Inject custom text in each new item tab
        select_category(driver)
        select_condition(driver)
        add_description(driver)
        set_availability(driver)
        set_visibility(driver)

      

        inject_custom_text(driver)  # Inject custom text after setting location

    window_handles = driver.window_handles
    save_draft(driver, window_handles, tabs_data)
    close_all_tabs_except_first(driver)

    window_handles = driver.window_handles
    for handle in window_handles:
        driver.switch_to.window(handle)
        inject_custom_text(driver)  # Inject custom text in each window handle

    # Handle continue buttons and check for completion
    handle_continue_buttons(driver)

    # Poll for the JavaScript completion flag
    WebDriverWait(driver, 800).until(lambda driver: driver.execute_script("return window.continueButtonsTaskCompleted;"))

    # Set location for all items
    window_handles = driver.window_handles
    for handle in window_handles[1:]:
        driver.switch_to.window(handle)
        locations_text = locations_entry.get("1.0", "end-1c").split('\n')
        set_location(driver, locations_text)
        inject_custom_text(driver)  # Inject custom text after setting location

    # Proceed with publishing items
    publish_item(driver, window_handles, tabs_data)

    messagebox.showinfo("Task Information", "Task Completed, Powered by AK Universe.")
    driver.quit()
