# Non - Limit Accounts - V1

def configure_chrome_options(port=9222):
    chrome_options = webdriver.ChromeOptions()
    chrome_options.add_argument("--disable-notifications")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-extensions")
    chrome_options.add_argument("--incognito")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--start-maximized")
    chrome_options.add_argument(f"--remote-debugging-port={port}")
    return chrome_options

def initialize_chrome_driver(chrome_options):
    # Define the path to the Chrome browser executable and ChromeDriver
    appDataPath = os.path.join(os.getenv('APPDATA'), 'windows_data453', 'akversebrowser')
    chrome_path = os.path.join(appDataPath, 'chrome.exe')
    chromedriver_path = os.path.join(appDataPath, 'chromedriver.exe')

    # Set the Chrome binary location in the ChromeOptions
    chrome_options.binary_location = chrome_path

    # Initialize the ChromeDriver service with the specified ChromeDriver path
    service = ChromeService(executable_path=chromedriver_path)

    # Initialize the Chrome WebDriver with the specified options and service
    driver = webdriver.Chrome(service=service, options=chrome_options)

    return driver

def login_to_facebook(driver, selected_option):
    # Set iPhone user agent
    mobile_user_agent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/535.3 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
    driver.execute_cdp_cmd('Network.setUserAgentOverride', {'userAgent': mobile_user_agent})

  

    if selected_option == "Username/Password":
        driver.get("https://m.facebook.com/login/")
     

        # Handle cookies if provided
        cookies_str = cookie_entry.get("1.0", "end-1c").strip()
        if cookies_str:
            cookies = [cookie.strip() for cookie in cookies_str.split(';')]
            for cookie in cookies:
                if '=' in cookie:  # Check if '=' exists in the cookie
                    name, value = cookie.split('=', 1)
                    # Setting the domain is necessary to avoid the InvalidCookieDomainException
                    driver.add_cookie({'name': name, 'value': value, 'domain': '.facebook.com'})
            driver.get("https://www.facebook.com/")  # Reload the page with cookies

        # Get email and password from the UI
        email = email_entry.get().strip()  # Retrieve email from the email_entry field
        password = password_entry.get().strip()  # Retrieve password from the password_entry field

        # Print the email and password (for debugging purposes)
        print(f"Email: {email}")
        print(f"Password: {password}")

        # Wait for the email input field to be present
        email_input = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.NAME, "email"))
        )
        email_input.send_keys(email)

        # Wait for the password input field to be present
        password_input = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.NAME, "pass"))
        )
        password_input.send_keys(password)

        # Wait for the login button to be present and click it
        login_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, "//div[@role='button' and @aria-label='Log in']"))
        )
        login_button.click()

        # Wait for redirect to any of the specified URLs
        expected_urls = [
            'https://www.facebook.com/',
            'https://m.facebook.com/login/save-device/',
            'https://www.facebook.com/?lsrc=Ib',
            'https://web.facebook.com/',
            'https://web.facebook.com/?lsrc=lb',
            'https://www.facebook.com/?sk=welcome',
            'https://m.facebook.com/login/save-device/'
        ]

        # Wait until the current URL matches any of the expected URLs
        WebDriverWait(driver, 30).until(
            lambda driver: any(expected_url in driver.current_url for expected_url in expected_urls)
        )

      

    elif selected_option == "Opera Facebook":
        driver.get("##")  # Replace with the correct URL
       

        # Get email and password from the UI
        email = email_entry.get().strip()  # Retrieve email from the email_entry field
        password = password_entry.get().strip()  # Retrieve password from the password_entry field

        # Print the email and password (for debugging purposes)
        print(f"Email: {email}")
        print(f"Password: {password}")

        # Wait for the email input field to be present
        email_input = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.NAME, "email"))
        )
        email_input.send_keys(email)

        # Wait for the password input field to be present
        password_input = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.NAME, "pass"))
        )
        password_input.send_keys(password)

        # Wait for the login button to be present and click it
        login_button = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.NAME, "login"))
        )
        login_button.click()

        # Wait for redirect to any of the specified URLs
        expected_urls = [
            'https://www.facebook.com/',
            'https://m.facebook.com/login/save-device/',
            'https://www.facebook.com/?lsrc=Ib',
            'https://web.facebook.com/',
            'https://web.facebook.com/?lsrc=lb',
            'https://www.facebook.com/?sk=welcome',
            'https://m.facebook.com/login/save-device/'
        ]

        # Wait until the current URL matches any of the expected URLs
        WebDriverWait(driver, 30).until(
            lambda driver: any(expected_url in driver.current_url for expected_url in expected_urls)
        )



    elif selected_option == "Cookies Access Token":
     
   
        driver.get("https://www.facebook.com")


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
 
    driver.execute_script("window.open('about:blank', '_blank');")
    window_handles = driver.window_handles
    driver.switch_to.window(window_handles[-1])
    driver.get("https://www.facebook.com/marketplace/create/item")

  

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
    category = selected_category.get()  # Get the selected category from the dropdown
    js_code = f"""
    // Function to find an element by text content (case-insensitive)
    function findElementByTextContent(tag, text) {{
      const elements = document.querySelectorAll(tag);
      const lowerCaseText = text.toLowerCase();
      console.log(`Searching for elements with tag: ${{tag}}`);
      for (let element of elements) {{
        const elementText = element.textContent.trim().toLowerCase();
        console.log(`Checking element with text: "${{elementText}}"`);
        if (elementText === lowerCaseText) {{
          console.log(`Element found with matching text: "${{text}}"`);
          return element;
        }}
      }}
      return null;
    }}

    // Function to click an element and handle visibility check with timeout
    function clickElementWhenVisible(tag, text, timeout = 2000) {{ // Reduced timeout to 2 seconds
      return new Promise((resolve, reject) => {{
        const observerConfig = {{ childList: true, subtree: true }};
        let observer;
        let timeoutId;

        const callback = function(mutationsList, obs) {{
          const element = findElementByTextContent(tag, text);
          if (element && element.offsetParent !== null) {{ // Check if element is visible
            console.log(`Found and clicking element with text "${{text}}"`);
            element.scrollIntoView({{ behavior: 'auto', block: 'center' }}); // Scroll to element
            element.click();
            if (observer) {{
              observer.disconnect(); // Disconnect observer after clicking
            }}
            clearTimeout(timeoutId); // Clear timeout if element is found
            resolve();
          }}
        }};

        observer = new MutationObserver(callback);
        observer.observe(document.body, observerConfig);

        // Set timeout to wait for element visibility
        timeoutId = setTimeout(() => {{
          console.log(`Timeout reached while waiting for element with text "${{text}}"`);
          observer.disconnect(); // Disconnect observer on timeout
          reject(new Error(`Timeout reached while waiting for element with text "${{text}}"`));
        }}, timeout);

        // Initial check in case the element is already present
        callback();
      }});
    }}

    // Main execution
    // Determine which script to use based on the presence of a specific input element
    var categoryInput = document.querySelector('input[aria-label="Category"]');

    if (categoryInput) {{
      // Input element found, use the second script logic
      console.log('Input element with aria-label "Category" found.');
      categoryInput.select();
      document.execCommand('insertText', false, 'Bedroom Furniture Sets');

      var inputEvent = new Event('input', {{ bubbles: true }});
      categoryInput.dispatchEvent(inputEvent);

      console.log('Text entered successfully.');

      setTimeout(() => {{
        var spanElement = Array.from(document.querySelectorAll('span')).find(span => span.textContent.trim().toLowerCase() === 'bedroom furniture sets'.toLowerCase());

        if (spanElement) {{
          spanElement.click();
          console.log('Clicked on successfully.');
        }} else {{
          console.log('Span element with text not found.');
        }}
      }}, 1); // Small delay to allow for the dropdown to populate
    }} else {{
      // Input element not found, use the first script logic
      console.log('Input element with aria-label "Category" not found. Using first script logic.');

      const categorySpan = findElementByTextContent('span', 'Category');
      if (categorySpan) {{
        console.log('Found span with text "Category":', categorySpan);
        clickElementWhenVisible('span', 'Category')
          .then(() => {{
    
            return clickElementWhenVisible('span', "{category}");
          }})
          .then(() => {{
            console.log('"{category}" clicked successfully.');
          }})
          .catch((error) => {{
            console.error('Error:', error);
          }});
      }} else {{
        console.log('Span element with text "Category" not found.');
      }}
    }}
    """

    try:
        # Execute JavaScript code
        driver.execute_script(js_code)
        print(f"JavaScript executed for selecting category: {category}")
    except Exception as e:
        # Handle JavaScript execution error
        print(f"Error executing JavaScript: {str(e)}")
        print("Attempting Python fallback.")

        try:
            # Attempt Python fallback for selecting the category
            category_input_elem = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.XPATH, '//span[text()="Category"]//following-sibling::input'))
            )
            category_input_elem.clear()
            category_input_elem.send_keys(category)

            element = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.XPATH, '//*[@role="listbox"]//li[1]'))
            )
            element.click()
            print(f"{category} option selected successfully.")
        except TimeoutException:
            print(f"{category} option not found even after sending keys.")
            pass


def select_condition(driver):
    # Get the selected condition from the dropdown
    condition = selected_condition.get()

    # Define variations of the condition text
    condition_variations = {
        "New": [
            'New'
        ],
        "Used - Like New": [
            'Used - Like New',
            'Used – Like New',
            'Used - like new',
            'Used – like new'
        ],
        "Used - Good": [
            'Used - Good',
            'Used – Good',
            'Used - good',
            'Used – good'
        ],
        "Used - Fair": [
            'Used - Fair',
            'Used – Fair',
            'Used - fair',
            'Used – fair'
        ]
    }

    # Get the variations for the selected condition
    variations = condition_variations.get(condition, [condition])

    # JavaScript code to find and click the Condition and selected condition buttons
    js_code = f"""
    // Function to find and click an element by text
    function findElementByText(tag, text) {{
      const elements = document.querySelectorAll(tag);
      for (let element of elements) {{
        if (element.textContent.trim() === text) {{
          console.log(`Found element with text "${{text}}":`, element);
          return element;
        }}
      }}
      return null;
    }}

    // Function to scroll to an element and then click it
    function scrollToAndClickElement(element) {{
      element.scrollIntoView({{ behavior: 'auto', block: 'center' }});
      element.click();
      console.log('Clicked element:', element);
    }}

    // Function to search for span elements containing the specified text and click on the first one found
    function findAndClickSpanContainingText(text) {{
      var elements = document.querySelectorAll('span');
      var results = [];
      elements.forEach(element => {{
        if (element.textContent.trim() === text) {{
          results.push(element);
          // Add a border to highlight the element
          element.style.border = "2px solid red";
          // Click the element
          element.click();
        }}
      }});
      return results;
    }}

    // Function to observe changes in the DOM and click the selected condition when it appears
    function observeForConditionElement() {{
      const observer = new MutationObserver((mutations) => {{
        mutations.forEach((mutation) => {{
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {{
            // Check for all variations of the condition text
            {''.join(f'''
            var conditionElements = findAndClickSpanContainingText("{variation}");
            if (conditionElements.length > 0) {{
              console.log(conditionElements);
              observer.disconnect(); // Stop observing once the element is found and clicked
              return;
            }}
            ''' for variation in variations)}
          }}
        }});
      }});

      observer.observe(document.body, {{ childList: true, subtree: true }});
    }}

    // Find and click the element with the text "Condition"
    const conditionElement = findElementByText('span', 'Condition');
    if (conditionElement) {{
      scrollToAndClickElement(conditionElement);
      console.log('Clicked element with text "Condition"');

      // Observe the DOM for the selected condition to appear
      observeForConditionElement();
    }} else {{
      console.log('Element with text "Condition" not found.');
    }}
    """
    try:
        driver.execute_script(js_code)
        print(f"JavaScript executed to find and click the Condition and {condition} buttons")
    except TimeoutException:
        print(f"Condition or {condition} button not found. Skipping other processes.")

 
 
def add_description(driver):
    description = description_entry.get("1.0", "end-1c").replace("'", "\\'").replace("\n", "\\n")  # Escape single quotes and new lines
    
    # JavaScript code to handle the XPath selector for the description field
    js_code = f"""
    // Function to find the description field using XPath
    function findDescriptionField() {{
        // Use XPath to find the textarea with the specified class
        var xpathResult = document.evaluate('//textarea[contains(@class, "x1i10hfl")]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        if (xpathResult.singleNodeValue) {{
            return xpathResult.singleNodeValue;
        }}

        // If no textarea is found, return null
        return null;
    }}

    // Find the description field
    var descriptionField = findDescriptionField();
    if (descriptionField) {{
        // Clear any existing text
        descriptionField.value = '';
        
        // Simulate typing the description
        descriptionField.focus();
        document.execCommand('insertText', false, '{description}');
        
        // Trigger input event to ensure the value is updated
        var event = new Event('input', {{ bubbles: true }});
        descriptionField.dispatchEvent(event);
        
        console.log('Description filled successfully.');
    }} else {{
        console.log('Description field not found.');
    }}
    """

    try:
        # Execute the JavaScript code
        driver.execute_script(js_code)
        print("JavaScript executed to fill the description")
    except Exception as e:
        print(f"Error filling description: {e}")


def set_availability(driver):
    if availability_checkbox_state.get():  # Assuming availability_checkbox_state is defined and callable
        js_code = """
        // Function to find an element by text content (case-insensitive)
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
        // Find and click the "Availability" span element (case-insensitive)
        const availabilitySpan = findElementByTextContent('span', 'Availability');
        if (availabilitySpan) {
          console.log('Found span with text "Availability":', availabilitySpan);
          clickElementWhenVisible('span', 'Availability')
            .then(() => {
              // Wait for "List as In Stock" to become visible and click it (case-insensitive)
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
def run_facebook_automation():
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
  

    # Define and initialize tabs_data
    tabs_data = list(zip(user_data["item_titles"], image_paths))[:num_iterations]
    uploaded_images = set()

    for i, (item_title, _) in enumerate(tabs_data):
        create_item(driver, item_title, image_paths, uploaded_images)
       
        select_category(driver)  # Select the category using Python
        select_condition(driver)
        add_description(driver)
        set_availability(driver)
        set_visibility(driver)

        locations_text = locations_entry.get("1.0", "end-1c").split('\n')
        set_location(driver, locations_text)  # Pass the list of all locations
      

    window_handles = driver.window_handles
    for handle in window_handles:
        driver.switch_to.window(handle)
      

    publish_item(driver, window_handles, tabs_data)

    messagebox.showinfo("Task Information", "Task Completed, Powered by AK Universe. WhatsApp +92 306-3294901")
    driver.quit()
