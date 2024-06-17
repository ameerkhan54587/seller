# 1:51am 18 june

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
    chrome_options.add_argument("--disable-speech-api")
    chrome_options.add_argument("--disable-hang-monitor")
    chrome_options.add_argument("--disable-client-side-phishing-detection")
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

def create_item(driver, item_title, available_image_paths):
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

    if available_image_paths:
        random_image_path = random.choice(available_image_paths)
        try:
            image_input = WebDriverWait(driver, 5).until(
                EC.presence_of_element_located((By.XPATH, "//input[@type='file']"))
            )
            image_input.send_keys(random_image_path)
        except TimeoutException:
            print("images not found. Skipping the process.")
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
        element = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, '//div[@class="x6s0dn4 x78zum5 x1q0g3np x1iyjqo2 x1qughib xeuugli"][//span[text()="New"]]'))
        )
        print("New button find")
        WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, '//div[@class="x6s0dn4 x78zum5 x1q0g3np x1iyjqo2 x1qughib xeuugli"]//span[text()="New"]'))
        ).click()
        print("New button Clicked")
    except TimeoutException:
        print("New button not found. Skipping other processes.")
    except NoSuchElementException:
        print("New button element does not exist. Skipping other processes.")

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

def set_location(driver, location):
    primary_location_xpath = '//span[text()="Location"]//following-sibling::input'
    similar_location_xpaths = [
        '//input[contains(@aria-label, "Location")]',
        '//input[@name="location"]'
    ]
    
    attempts = 0
    max_attempts = 5
    location_set = False

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
            if attempts < max_attempts:
                print(f"Location element not found, retrying... (Attempt {attempts}/{max_attempts})")
            else:
                print("Max attempts reached. Unable to set location.")
                location_set = False

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
            except Exception as e:
                print(f"An error occurred: {str(e)}. Retrying... (Attempt {attempts}/{max_attempts})")
                attempts += 1

    if not location_set:
        print("Unable to set location after maximum attempts.")

def publish_item(driver, current_tab_index, window_handles, tabs_data):
    while current_tab_index <= len(tabs_data):
        try:
            next_button = WebDriverWait(driver, 3).until(
                EC.element_to_be_clickable((By.XPATH, '//span[contains(text(),"Next")]'))
            )
            driver.execute_script("arguments[0].click();", next_button)
            
            publish_button = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.XPATH, '//span[contains(text(),"Publish")]'))
            )
            WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, '//span[contains(text(),"Publish")]'))
            )
            driver.execute_script("arguments[0].click();", publish_button)

        except TimeoutException:
            try:
                publish_button = WebDriverWait(driver, 5).until(
                    EC.presence_of_element_located((By.XPATH, '//span[contains(text(),"Publish")]'))
                )
                print("Publish Found - after not find Next button")
                driver.execute_script("arguments[0].click();", publish_button)

            except TimeoutException:
                if current_tab_index < len(tabs_data) - 1:
                    driver.switch_to.window(window_handles[current_tab_index + 1])
                    current_tab_index += 1
                else:
                    print("Error: Unable to find 'Next' or 'Publish' button.")

        driver.switch_to.window(window_handles[current_tab_index])
        current_tab_index += 1

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

    tabs_data = list(zip(user_data["item_titles"], image_paths))[:num_iterations]
    uploaded_images = set()

    for i, (item_title, _) in enumerate(tabs_data):
        create_item(driver, item_title, [path for path in image_paths if path not in uploaded_images])
        select_category(driver)
        select_condition(driver)
        add_description(driver)
        set_availability(driver)
        set_visibility(driver)

        locations_text = locations_entry.get("1.0", "end-1c").split('\n')
        location = get_random_location(locations_text)

        if location:
            set_location(driver, location)

    current_tab_index = 1
    window_handles = driver.window_handles
    publish_item(driver, current_tab_index, window_handles, tabs_data)

    time.sleep(0.002)

    messagebox.showinfo("Designed by Ameer Khan", "Task Successfully Executed, Designed by Ameer Khan")
    driver.quit()
