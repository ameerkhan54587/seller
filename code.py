# 7:20PM 26 june

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

    try:
        more_details_button = driver.find_element(By.XPATH, '//span[text()="More details"]')
        ActionChains(driver).move_to_element(more_details_button).click().perform()
        print("Clicked on 'More details'")
    except NoSuchElementException:
        print("Element 'More details' not found. Skipping the click action.")


def select_category(driver):
    try:
        category_parent_elem = driver.find_element(By.XPATH, '//span[contains(text(),"Category")]')
        driver.execute_script("arguments[0].click();", category_parent_elem)
    except NoSuchElementException:
        print("Category option not found. Skipping the process.")

    actions = ActionChains(driver)
    actions.move_to_element(category_parent_elem)
    actions.perform()

    try:
        element = WebDriverWait(driver, 2).until(
            EC.presence_of_element_located((By.XPATH, '//div[@class="x8aayfw"]/span[text()="Furniture"]'))
        )
        driver.execute_script("arguments[0].scrollIntoView(true);", element)
        driver.execute_script("arguments[0].click();", element)
    except TimeoutException:
        print("Furniture option not found. Skipping the process.")
        try:
            category_input_elem = driver.find_element(By.XPATH, '//span[text()="Category"]//following-sibling::input')
            category_input_elem.clear()
            category_input_elem.send_keys("Bedroom Furniture Sets")

            element = WebDriverWait(driver, 3).until(
                EC.element_to_be_clickable((By.XPATH, '//*[@role="listbox"]//li[1]'))
            )
            print("Element found:", element.text)
            element.click()
            print("Element clicked")
        except TimeoutException:
            print("Bedroom Furniture Sets option not found even after sending keys.")
            pass

def select_condition(driver):
    try:
        condition_elem = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, '//span[contains(text(),"Condition")]'))
        )
        driver.execute_script("arguments[0].click();", condition_elem)
    except TimeoutException:
        print("Condition button not found. Skipping other processes.")

    actions = ActionChains(driver)
    actions.move_to_element(condition_elem).perform()

    try:
        js_code = """
        const element = document.querySelector('.html-div.xe8uvvx.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x6s0dn4.x78zum5.x1q0g3np.x1iyjqo2.x1qughib.xeuugli .x78zum5.xdt5ytf.xz62fqu.x16ldp7u .xu06os2.x1ok221b .x193iq5w.xeuugli.x13faqbe.x1vvkbs.x1xmvt09.x1lliihq.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.xudqn12.x3x7a5m.x6prxxf.xvq8zen.xk50ysn.xzsf02u.x1yc453h');
        if (element && element.textContent.includes('New')) {
            console.log('Found element:', element);
            element.click();
        }
        """

        driver.execute_script(js_code)
        print("JavaScript executed to find and click the New button")
    except (TimeoutException, NoSuchElementException):
        print("New button not found. Skipping other processes.")
 

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
    if availability_checkbox_state.get():
        try:
            availability_elem = driver.find_element(By.XPATH, '//span[contains(text(),"Availability")]')
        except NoSuchElementException:
            print("Availability element not found. Skipping availability-related tasks.")
            availability_elem = None

        if availability_elem:
            driver.execute_script("arguments[0].click();", availability_elem)

            actions = ActionChains(driver)
            actions.move_to_element(availability_elem).perform()

            try:
                in_stock_option = WebDriverWait(driver, 5).until(
                    EC.element_to_be_clickable((By.XPATH, '//span[contains(translate(text(),"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz"),"list as in stock")]'))
                )
                print("List as In Stocks' found")
                driver.execute_script("arguments[0].scrollIntoView(true);", in_stock_option)
                driver.execute_script("arguments[0].click();", in_stock_option)
                print("List as In Stocks' Click first")
            except TimeoutException:
                print("Element 'List as In Stocks' not found. Skipping the process.")

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
