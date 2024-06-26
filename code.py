# 10:35pm 26 june

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
    return chrome_options

def initialize_chrome_driver(chrome_options):
    chromedriver_path = os.path.join(os.getcwd(), 'chromedriver-win32', 'chromedriver.exe')
    service = ChromeService(executable_path=chromedriver_path)
    driver = webdriver.Chrome(service=service, options=chrome_options)
    driver.maximize_window()
    return driver

def login_to_facebook(driver, selected_option):
    if selected_option == "Normal Facebook":
        driver.get("https://akuniverse.github.io/AKUniverse/plan.html")
        time.sleep(1)
        driver.get("https://www.facebook.com/login/")
        email_elem = driver.find_element(By.ID, "email")
        password_elem = driver.find_element(By.ID, "pass")
        login_button_elem = driver.find_element(By.NAME, "login")
        email_elem.send_keys(user_data["email"])
        password_elem.send_keys(user_data["password"])
        login_button_elem.click()
    elif selected_option == "Opera Facebook":
        driver.get("https://akuniverse.github.io/AKUniverse/plan.html")
        time.sleep(1)
        driver.get("https://www.facebook.com/login.php?skip_api_login=1&api_key=449838951736891&kid_directed_site=0&app_id=449838951736891&signed_next=1&next=https%3A%2F%2Fwww.facebook.com%2Fv2.12%2Fdialog%2Foauth%2Foauth%3Fresponse_type%3Dcode%26client_id%3D449838951736891%26redirect_uri%3Dhttps%253A%252F%252Fauth.opera.com%252Faccount%252Fsocial%252Fv4%252Fcallback%26scope%3Demail%26state%3DUWF8PvKkASQ6pfdptiLg6NIuRufr4U%26ret%3Dlogin%26fbapp_pres%3D0%26logger_id%3Db3aa3710-abfa-4798-b8ad-8e7d1eccc96c%26tp%3Dunspecified&cancel_url=https%3A%2F%2Fauth.opera.com%2Faccount%2Fsocial%2Fv4%252Fcallback%3Ferror%3Daccess_denied%26error_code%3D200%26error_description%3DPermissions%2Berror%26error_reason%3Duser_denied%26state%3DUWF8PvKkASQ6pfdptiLg6NIuRufr4U%23_%3D_&display=page&locale=en_GB&pl_dbl=0")
        email_elem = driver.find_element(By.ID, "email")
        password_elem = driver.find_element(By.ID, "pass")
        login_button_elem = driver.find_element(By.NAME, "login")
        email_elem.send_keys(user_data["email"])
        password_elem.send_keys(user_data["password"])
        login_button_elem.click()
    elif selected_option == "Cookies Access Token":
        driver.get("https://akuniverse.github.io/AKUniverse/plan.html")
        time.sleep(1)
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
        title_elem = WebDriverWait(driver, 5).until(
            EC.presence_of_element_located((By.XPATH, '//span[text()="Title"]//following-sibling::input'))
        )
        price_elem = WebDriverWait(driver, 5).until(
            EC.presence_of_element_located((By.XPATH, '//span[text()="Price"]//following-sibling::input'))
        )
        title_elem.send_keys(item_title)
        price_elem.send_keys(price_entry.get())
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
        spanElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
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


def select_category(driver):
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

    // Function to click an element and handle visibility check with timeout
    function clickElementWhenVisible(tag, text, timeout = 5000) {
      return new Promise((resolve, reject) => {
        const observerConfig = { childList: true, subtree: true };
        let observer;
        let timeoutId;

        const callback = function(mutationsList, obs) {
          const element = findElementByTextContent(tag, text);
          if (element && element.offsetParent !== null) { // Check if element is visible
            console.log(`Found and clicking element with text "${text}"`);
            element.scrollIntoView({ behavior: 'smooth', block: 'center' }); // Scroll to element
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
    // Find and click the "Furniture" span element
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
    """

    try:
        # Execute JavaScript code
        driver.execute_script(js_code)
        print("JavaScript executed for selecting category")
    except Exception as e:
        # Handle JavaScript execution error
        print(f"Error executing JavaScript: {str(e)}")
        print("Attempting Python fallback.")

        try:
            # Attempt Python fallback for selecting "Bedroom Furniture Sets"
            category_input_elem = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.XPATH, '//span[text()="Category"]//following-sibling::input'))
            )
            category_input_elem.clear()
            category_input_elem.send_keys("Bedroom Furniture Sets")

            element = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.XPATH, '//*[@role="listbox"]//li[1]'))
            )
            element.click()
            print("Bedroom Furniture Sets option selected successfully.")
        except TimeoutException:
            print("Bedroom Furniture Sets option not found even after sending keys.")
            pass


def select_condition(driver):
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

    // Function to wait for an element with specific text to become visible and then click it
    function waitForElementAndClick(tag, text) {
      const targetNode = document.body;
      const observerConfig = { childList: true, subtree: true };

      const callback = function(mutationsList, observer) {
        const element = findElementByText(tag, text);
        if (element) {
          console.log(`Found and clicking element with text "${text}":`, element);
          scrollToAndClickElement(element);
          observer.disconnect();
        }
      };

      const observer = new MutationObserver(callback);
      observer.observe(targetNode, observerConfig);

      // Initial check in case the element is already present
      callback();
    }

    // Find and click the element with the text "Condition"
    const conditionElement = findElementByText('span', 'Condition');
    if (conditionElement) {
      scrollToAndClickElement(conditionElement);
      console.log('Clicked element with text "Condition"');

      // Wait for the element with the text "New" to become visible and click it
      waitForElementAndClick('span', 'New');
    } else {
      console.log('Element with text "Condition" not found.');
    }
    """

    try:
        driver.execute_script(js_code)
        print("JavaScript executed to find and click the Condition and New buttons")
    except (TimeoutException, NoSuchElementException):
        print("Condition or New button not found. Skipping other processes.")

 

def add_description(driver):
    description = description_entry.get("1.0", "end-1c")  # Retrieve description text from GUI
    try:
        description_field = WebDriverWait(driver, 5).until(
            EC.visibility_of_element_located((By.XPATH, '//label[@aria-label="Description"]//textarea'))
        )
        description_field.clear()
        description_field.send_keys(description)
    except TimeoutException:
        print("Description field not found. Skipping the process.")

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
    primary_location_xpath = '//span[text()="Location"]//following-sibling::input'
    similar_location_xpaths = [
        '//input[contains(@aria-label, "Location")]',
        '//input[@name="location"]'
    ]
    
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
                location_elem = WebDriverWait(driver, 8).until(
                    EC.visibility_of_element_located((By.XPATH, primary_location_xpath))
                )

                location_elem.click()  # Ensure the element is in view
                location_elem.send_keys(Keys.CONTROL + "a")  # Select all the text in the input field
                location_elem.send_keys(Keys.DELETE)  # Delete the selected text
                location_elem.send_keys(location)  # Enter the new location

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
                            location_elem = WebDriverWait(driver, 10).until(
                                EC.visibility_of_element_located((By.XPATH, primary_location_xpath))
                            )

                            location_elem.click()  # Ensure the element is in view
                            location_elem.send_keys(Keys.CONTROL + "a")  # Select all the text in the input field
                            location_elem.send_keys(Keys.DELETE)  # Delete the selected text
                            location_elem.send_keys(location)  # Enter the new location

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
            # Try to click the 'Next' button to get to the 'Publish' button
            next_button = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.XPATH, '//span[contains(text(),"Next")]'))
            )
            driver.execute_script("arguments[0].click();", next_button)
            print(f"Clicked 'Next' on tab {current_tab_index + 1}")
            
            # Wait and click the 'Publish' button
            publish_button = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, '//span[contains(text(),"Publish")]'))
            )
            driver.execute_script("arguments[0].click();", publish_button)
            print(f"Clicked 'Publish' on tab {current_tab_index + 1}")
        
        except TimeoutException:
            print(f"'Next' or 'Publish' button not found on tab {current_tab_index + 1}")
            
            # Try to find and click the 'Publish' button directly
            try:
                publish_button = WebDriverWait(driver, 5).until(
                    EC.element_to_be_clickable((By.XPATH, '//span[contains(text(),"Publish")]'))
                )
                driver.execute_script("arguments[0].click();", publish_button)
                print(f"Directly clicked 'Publish' on tab {current_tab_index + 1}")
            
            except TimeoutException:
                print(f"Neither 'Next' nor 'Publish' buttons were found on tab {current_tab_index + 1}")
        
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

    # Define and initialize tabs_data
    tabs_data = list(zip(user_data["item_titles"], image_paths))[:num_iterations]
    uploaded_images = set()

    for i, (item_title, _) in enumerate(tabs_data):
        create_item(driver, item_title, image_paths, uploaded_images)
        select_category(driver)
        select_condition(driver)
        add_description(driver)
        set_availability(driver)
        set_visibility(driver)

        locations_text = locations_entry.get("1.0", "end-1c").split('\n')
        set_location(driver, locations_text)  # Pass the list of all locations

    window_handles = driver.window_handles
    publish_item(driver, window_handles, tabs_data)

    time.sleep(0.002)

    messagebox.showinfo("Designed by Ameer Khan", "Task Successfully Executed, Designed by Ameer Khan")
    driver.quit()
