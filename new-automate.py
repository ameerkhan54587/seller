def configure_chrome_driver():
    chrome_options = webdriver.ChromeOptions()
    chrome_options.add_argument("--disable-notifications")
    chrome_options.add_argument("--no-first-run")

    chromedriver_path = os.path.join(os.getcwd(), 'chromedriver-win32', 'chromedriver.exe')
    service = ChromeService(executable_path=chromedriver_path)
    return webdriver.Chrome(service=service, options=chrome_options)

def set_cookies(driver, cookies):
    cookies = [cookie.strip() for cookie in cookies.split(';')]
    for cookie in cookies:
        if '=' in cookie:
            name, value = cookie.split('=', 1)
            driver.add_cookie({'name': name, 'value': value, 'domain': '.facebook.com'})

def login_facebook(driver, user_data, url):
    driver.get(url)
    email_elem = driver.find_element(By.ID, "email")
    password_elem = driver.find_element(By.ID, "pass")
    login_button_elem = driver.find_element(By.NAME, "login")
    email_elem.send_keys(user_data["email"])
    password_elem.send_keys(user_data["password"])
    login_button_elem.click()

def fill_form(driver, item_title, image_path, price, description, location):
    try:
        title_elem = WebDriverWait(driver, 5).until(
            EC.presence_of_element_located((By.XPATH, '//span[text()="Title"]//following-sibling::input'))
        )
        title_elem.send_keys(item_title)
    except TimeoutException:
        print("Title element not found.")

    try:
        price_elem = WebDriverWait(driver, 5).until(
            EC.presence_of_element_located((By.XPATH, '//span[text()="Price"]//following-sibling::input'))
        )
        price_elem.send_keys(price)
    except TimeoutException:
        print("Price element not found.")

    if image_path:
        try:
            image_input = WebDriverWait(driver, 5).until(
                EC.presence_of_element_located((By.XPATH, "//input[@type='file']"))
            )
            image_input.send_keys(image_path)
        except TimeoutException:
            print("Image input element not found.")

    try:
        more_details_button = WebDriverWait(driver, 5).until(
            EC.element_to_be_clickable((By.XPATH, '//span[text()="More details"]'))
        )
        ActionChains(driver).move_to_element(more_details_button).click().perform()
    except TimeoutException:
        print("More details button not found.")

    try:
        category_parent_elem = WebDriverWait(driver, 5).until(
            EC.element_to_be_clickable((By.XPATH, '//span[contains(text(),"Category")]'))
        )
        driver.execute_script("arguments[0].click();", category_parent_elem)
        WebDriverWait(driver, 2).until(
            EC.presence_of_element_located((By.XPATH, '//div[@class="x8aayfw"]/span[text()="Furniture"]'))
        ).click()
    except TimeoutException:
        print("Category selection not found.")

    try:
        condition_elem = WebDriverWait(driver, 5).until(
            EC.element_to_be_clickable((By.XPATH, '//span[contains(text(),"Condition")]'))
        )
        driver.execute_script("arguments[0].click();", condition_elem)
        WebDriverWait(driver, 5).until(
            EC.presence_of_element_located((By.XPATH, '//div[@class="x6s0dn4 x78zum5 x1q0g3np x1iyjqo2 x1qughib xeuugli"][//span[text()="New"]]'))
        ).click()
    except TimeoutException:
        print("Condition selection not found.")

    try:
        description_field = WebDriverWait(driver, 5).until(
            EC.visibility_of_element_located((By.XPATH, '//label[@aria-label="Description"]//textarea'))
        )
        description_field.clear()
        description_field.send_keys(description)
    except TimeoutException:
        print("Description field not found.")

    try:
        location_elem = WebDriverWait(driver, 5).until(
            EC.visibility_of_element_located((By.XPATH, '//span[text()="Location"]//following-sibling::input'))
        )
        location_elem.click()
        location_elem.send_keys(Keys.CONTROL + "a")
        location_elem.send_keys(Keys.DELETE)
        location_elem.send_keys(location)
        WebDriverWait(driver, 5).until(
            EC.element_to_be_clickable((By.XPATH, '//ul[@role="listbox"]//li[1]'))
        ).click()
    except TimeoutException:
        print("Location element not found.")

    try:
        next_button = WebDriverWait(driver, 5).until(
            EC.element_to_be_clickable((By.XPATH, '//span[contains(text(),"Next")]'))
        )
        driver.execute_script("arguments[0].click();", next_button)
    except TimeoutException:
        print("Next button not found.")

    try:
        publish_button = WebDriverWait(driver, 5).until(
            EC.element_to_be_clickable((By.XPATH, '//span[contains(text(),"Publish")]'))
        )
        driver.execute_script("arguments[0].click();", publish_button)
    except TimeoutException:
        print("Publish button not found.")

def run_facebook_automation():
    save_user_data()

    run_button.config(text="Processing Task...", state=tk.DISABLED, bg='#777', fg='orange')
    root.update_idletasks()
    root.after(1000, task_completed)

    driver = configure_chrome_driver()
    driver.maximize_window()

    num_iterations = int(iterations_entry.get()) if iterations_entry.get().isdigit() else 3
    selected_option = selected_fblink.get()
    cookies_str = cookie_entry.get("1.0", "end-1c")

    if selected_option == "Normal Facebook":
        login_facebook(driver, user_data, "https://www.facebook.com/login/")
    elif selected_option == "Opera Facebook":
        login_facebook(driver, user_data, "https://www.facebook.com/login.php?skip_api_login=1&api_key=449838951736891...")
    elif selected_option == "Cookies Access Token":
        driver.get("https://www.facebook.com")
        set_cookies(driver, cookies_str)

    tabs_data = list(zip(user_data["item_titles"], image_paths))[:num_iterations]
    threads = []

    for item_title, image_path in tabs_data:
        driver.execute_script("window.open('about:blank', '_blank');")
        driver.switch_to.window(driver.window_handles[-1])
        driver.get("https://www.facebook.com/marketplace/create/item")

        price = price_entry.get()
        description = description_entry.get("1.0", "end-1c")
        location = locations_entry.get("1.0", "end-1c").split('\n')[0]  # Assuming a single location for simplicity

        thread = threading.Thread(target=fill_form, args=(driver, item_title, image_path, price, description, location))
        threads.append(thread)
        thread.start()

    for thread in threads:
        thread.join()

    messagebox.showinfo("Designed by Ameer Khan", "Task Successfully Executed, Designed by Ameer Khan")
    driver.quit()
