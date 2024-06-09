def run_facebook_automation():
    def save_user_data():
        # Dummy implementation of save_user_data()
        pass

    def set_cookies(driver, cookies):
        for cookie in cookies.split(';'):
            if '=' in cookie:
                name, value = cookie.split('=', 1)
                driver.add_cookie({'name': name, 'value': value, 'domain': '.facebook.com'})

    def batch_fill_forms(driver, tabs_data, image_paths):
        uploaded_images = set()
        for item_title, price in tabs_data:
            driver.execute_script("window.open('about:blank', '_blank');")
            driver.switch_to.window(driver.window_handles[-1])
            driver.get("https://www.facebook.com/marketplace/create/item")

            # Fill form
            title_elem = WebDriverWait(driver, 5).until(EC.presence_of_element_located((By.XPATH, '//span[text()="Title"]//following-sibling::input')))
            price_elem = WebDriverWait(driver, 5).until(EC.presence_of_element_located((By.XPATH, '//span[text()="Price"]//following-sibling::input')))
            title_elem.send_keys(item_title)
            price_elem.send_keys(price)

            # Upload image
            available_image_paths = [path for path in image_paths if path not in uploaded_images]
            if available_image_paths:
                random_image_path = random.choice(available_image_paths)
                uploaded_images.add(random_image_path)
                image_input = WebDriverWait(driver, 5).until(EC.presence_of_element_located((By.XPATH, "//input[@type='file']")))
                image_input.send_keys(random_image_path)

            # Other form fields...
            description = description_entry.get("1.0", "end-1c")
            description_field = WebDriverWait(driver, 5).until(EC.visibility_of_element_located((By.XPATH, '//label[@aria-label="Description"]//textarea')))
            description_field.clear()
            description_field.send_keys(description)

            # More form fields...

    def process_task():
        # Setup Chrome options
        chrome_options = webdriver.ChromeOptions()
        chrome_options.add_argument("--disable-notifications")
        chrome_options.add_argument("--no-first-run")

        # Specify the path to chromedriver
        chromedriver_path = os.path.join(os.getcwd(), 'chromedriver-win32', 'chromedriver.exe')
        service = ChromeService(executable_path=chromedriver_path)
        driver = webdriver.Chrome(service=service, options=chrome_options)
        driver.maximize_window()

        # Get number of iterations
        num_iterations = int(iterations_entry.get()) if iterations_entry.get().isdigit() else 3
        selected_option = selected_fblink.get()
        cookies = cookie_entry.get("1.0", "end-1c")

        # Login based on selected option
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
            driver.get("https://www.facebook.com/login.php?skip_api_login=1&api_key=449838951736891&kid_directed_site=0&app_id=449838951736891&signed_next=1&next=https%3A%2F%2Fwww.facebook.com%2Fv2.12%2Fdialog%2Foauth%3Fresponse_type%3Dcode%26client_id%3D449838951736891%26redirect_uri%3Dhttps%253A%252F%252Fauth.opera.com%252Faccount%252Fsocial%252Fv4%252Fcallback%26scope%3Demail%26state%3DUWF8PvKkASQ6pfdptiLg6NIuRufr4U%26ret%3Dlogin%26fbapp_pres%3D0%26logger_id%3Db3aa3710-abfa-4798-b8ad-8e7d1eccc96c%26tp%3Dunspecified&cancel_url=https%3A%2F%2Fauth.opera.com%2Faccount%2Fsocial%2Fv4%2Fcallback%3Ferror%3Daccess_denied%26error_code%3D200%26error_description%3DPermissions%2Berror%26error_reason%3Duser_denied%26state%3DUWF8PvKkASQ6pfdptiLg6NIuRufr4U%23_%3D_&display=page&locale=en_GB&pl_dbl=0")
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
            set_cookies(driver, cookies)

        tabs_data = list(zip(user_data["item_titles"], [price_entry.get()] * num_iterations))[:num_iterations]
        threads = []
        
        # Create threads for parallel processing
        for i in range(num_iterations):
            thread = threading.Thread(target=batch_fill_forms, args=(driver, tabs_data, image_paths))
            threads.append(thread)
            thread.start()

        for thread in threads:
            thread.join()

        messagebox.showinfo("Designed by Ameer Khan", "Task Successfully Executed, Designed by Ameer Khan")
        driver.quit()

    run_button.config(text="Processing Task...", state=tk.DISABLED, bg='#777', fg='orange')
    root.update_idletasks()
    root.after(1000, process_task)