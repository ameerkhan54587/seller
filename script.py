import tkinter as tk
from tkinter import Label, Entry, Button, Text, Scrollbar, messagebox, filedialog, END, Checkbutton
from tkinter import Label, Entry, Button, Text, OptionMenu, Listbox, Scrollbar, messagebox, filedialog
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from selenium.common.exceptions import NoSuchElementException
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.service import Service as ChromeService
import firebase_admin
from firebase_admin import credentials
from firebase_admin import auth
import time
import random
import json

if not firebase_admin._apps:
    cred = credentials.Certificate("C:/data-learner-fc1c7-firebase-adminsdk-871tc-7fecf5bcac.json")  # Replace with your service account key file path
    firebase_admin.initialize_app(cred)

# Create a dictionary to store user data
user_data = {
    "email": "",
    "password": "",
    "item_titles": [],
    "image_paths": [],  # Store selected image paths
}

# Define global variables for GUI components
email_entry = None
password_entry = None
item_titles_entry = None
price_entry = None
image_listbox = None  # Listbox to display selected images
image_paths = []  # List to store selected image paths

def save_user_data():
    user_data["email"] = email_entry.get()
    user_data["password"] = password_entry.get()
    user_data["password2"] = password_entry_main.get()
    user_data["email2"] = email_entry_main.get()
    user_data["item_titles"] = item_titles_entry.get("1.0", "end-1c").split("\n")
    user_data["price"] = price_entry.get()
    user_data["description"] = description_entry.get("1.0", "end-1c")
    user_data["locations"] = locations_entry.get("1.0", "end-1c").split("\n")
    user_data["image_paths"] = image_paths  # Assuming image_paths is a list variable

    # Save user data to a JSON file
    with open("user_data.json", "w") as file:
        json.dump(user_data, file)

def get_free_proxy():
    proxy = FreeProxy(country_id=['US'], timeout=1).get()
    return proxy

def load_user_data():
    try:
        with open("user_data.json", "r") as file:
            user_data.update(json.load(file))
            email_entry.delete(0, "end")
            email_entry.insert(0, user_data.get("email", ""))
            password_entry.delete(0, "end")
            password_entry.insert(0, user_data.get("password", ""))
            email_entry_main.delete(0, "end")
            email_entry_main.insert(0, user_data.get("email2", ""))
            password_entry_main.delete(0, "end")
            password_entry_main.insert(0, user_data.get("password2", ""))
            item_titles_entry.delete("1.0", "end")
            item_titles_entry.insert("1.0", "\n".join(user_data.get("item_titles", [])))
            price_entry.delete(0, "end")
            price_entry.insert(0, user_data.get("price", ""))
            description_entry.delete("1.0", "end")
            description_entry.insert("1.0", user_data.get("description", ""))
            locations_entry.delete("1.0", "end")
            locations_entry.insert("1.0", "\n".join(user_data.get("locations", [])))
            # Assuming image_paths is a list variable, update it accordingly
            image_paths = user_data.get("image_paths", [])
    except FileNotFoundError:
        pass

def update_image_count():
    count = len(image_paths)
    image_count_label.config(text=f"Number of Images: {count}")
    
def upload_image():
    file_paths = filedialog.askopenfilenames(title="Select Image(s)", filetypes=(("Image files", "*"), ("All files", "*.*")))
    if file_paths:
        image_paths.extend(file_paths)
        for file_path in file_paths:
            image_listbox.insert(tk.END, file_path)
            update_image_count()

def delete_selected_image():
    global image_paths  # Use the global variable
    selected_indices = image_listbox.curselection()
    for index in reversed(selected_indices):
        if index < len(image_paths):
            del image_paths[index]
    update_image_count()
    update_image_listbox()  # Add this line if necessary

def update_image_listbox():
    image_listbox.delete(0, tk.END)
    for file_path in image_paths:
        image_listbox.insert(tk.END, file_path)


        
def find_element_with_similar_xpath(driver, xpaths, max_wait_time=10):
    for xpath in xpaths:
        try:
            element = WebDriverWait(driver, max_wait_time).until(
                EC.presence_of_element_located((By.XPATH, xpath))
            )
            return element
        except TimeoutException:
            continue
    return None        

def run_facebook_automation():
    save_user_data()
    chrome_options = webdriver.ChromeOptions()
    chrome_options.add_argument("--disable-notifications")
    chrome_options.add_argument("--disable-extensions")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--blink-settings=imagesEnabled=false")
    chrome_options.add_argument("--disable-dev-tools")
    chrome_options.add_argument("--disable-logging")
    chrome_options.add_argument("--disable-infobars")
    chrome_options.add_argument("--disable-popup-blocking")
    chrome_options.add_argument("--disable-autofill")
    chrome_options.add_argument("--disable-javascript")
    chrome_options.add_argument("--disable-web-security")

    # Preload essential resources and leverage browser caching
    chrome_options.add_argument("--enable-preconnect")
    chrome_options.add_argument("--enable-resource-prefetching")
    chrome_options.add_argument("--disk-cache-size=0")


    chromedriver_path = 'C:\\chromedriver.exe'
    service = ChromeService(executable_path=chromedriver_path)
    driver = webdriver.Chrome(service=service, options=chrome_options)
    driver.maximize_window()
    
    selected_option = selected_fblink.get()
    if selected_option == "Normal Facebook":
        driver.get("https://www.facebook.com/login/")
    elif selected_option == "Opera Facebook":
        driver.get("https://www.facebook.com/login.php?skip_api_login=1&api_key=449838951736891&kid_directed_site=0&app_id=449838951736891&signed_next=1&next=https%3A%2F%2Fwww.facebook.com%2Fv2.12%2Fdialog%2Foauth%3Fresponse_type%3Dcode%26client_id%3D449838951736891%26redirect_uri%3Dhttps%253A%252F%252Fauth.opera.com%252Faccount%252Fsocial%252Fv4%252Fcallback%26scope%3Demail%26state%3DUWF8PvKkASQ6pfdptiLg6NIuRufr4U%26ret%3Dlogin%26fbapp_pres%3D0%26logger_id%3Db3aa3710-abfa-4798-b8ad-8e7d1eccc96c%26tp%3Dunspecified&cancel_url=https%3A%2F%2Fauth.opera.com%2Faccount%2Fsocial%2Fv4%2Fcallback%3Ferror%3Daccess_denied%26error_code%3D200%26error_description%3DPermissions%2Berror%26error_reason%3Duser_denied%26state%3DUWF8PvKkASQ6pfdptiLg6NIuRufr4U%23_%3D_&display=page&locale=en_GB&pl_dbl=0")

    
    
    email_elem = driver.find_element(By.ID, "email")
    password_elem = driver.find_element(By.ID, "pass")
    login_button_elem = driver.find_element(By.NAME, "login")
    email_elem.send_keys(user_data["email"])
    password_elem.send_keys(user_data["password"])
    login_button_elem.click()
    time.sleep(2)

    tabs_data = list(zip(user_data["item_titles"], image_paths))
    

    for i, (item_title, image_path) in enumerate(tabs_data):
        driver.execute_script("window.open('about:blank', '_blank');")
        window_handles = driver.window_handles
        driver.switch_to.window(window_handles[-1])
        driver.get("https://www.facebook.com/marketplace/create/item")


        try:
            more_details_details_elem = driver.find_element(By.XPATH, '//span[contains(text(),"More Details")]')
            driver.execute_script("arguments[0].click();", more_details_details_elem)
        except NoSuchElementException:
            print("More Details element not found. Skipping the click.")
            # Optionally, you can add any other actions or logging as needed
            try:
                alternative_elem = driver.find_element(By.XPATH, '//span[contains(text(),"Attract more interest by including more details")]')
                driver.execute_script("arguments[0].click();", alternative_elem)
            except NoSuchElementException:
                print("Alternative element not found. Skipping both clicks.")
                # Optionally, you can add any other actions or logging as needed
            pass




        
        try:
            title_elem, price_field = WebDriverWait(driver, 10).until(
                EC.presence_of_all_elements_located((By.XPATH, '//span[text()="Title" or text()="Price"]//following-sibling::input'))
            )
        except TimeoutException:
            title_elem = find_element_with_similar_xpath(driver, [
                '//input[contains(@aria-label, "Title")]', 
                '//input[@name="title"]'
            ])

            price_field = find_element_with_similar_xpath(driver, [
                '//input[contains(@aria-label, "Price")]', 
                '//input[@name="price"]'
            ])

        if title_elem is not None:
            title_elem.send_keys(item_title)
        if price_field is not None:
            price_field.send_keys(price_entry.get())

        
        


        
    
        
        
        
         
# Add the category selection code here
        try:
            category_parent_elem = driver.find_element(By.XPATH, '//span[contains(text(),"Category")]')
        except NoSuchElementException:
            category_parent_elem = find_element_with_similar_xpath(driver, [
                '//div[contains(@aria-label, "Category")]',
                '//span[contains(text(),"Category")]'
            ])

        if category_parent_elem is not None:
            driver.execute_script("arguments[0].click();", category_parent_elem)

        actions = ActionChains(driver)
        actions.move_to_element(category_parent_elem)
        actions.perform()

        # Select the category from the dropdown menu

        try:
            element = WebDriverWait(driver, 1).until(
                EC.presence_of_element_located((By.XPATH, '//div[@class="x8aayfw"]/span[text()="Furniture"]'))
            )
            element.click()
        except TimeoutException:
            # If "Furniture" option is not found, skip the entire process
            print("Furniture option not found. Skipping the process.")
            # Optionally, you can add any other actions or logging as needed
    
        
            try:
                # If not found, locate the category input element and enter the category text
                category_input_elem = WebDriverWait(driver, 0).until(
                    EC.presence_of_element_located((By.XPATH, '//span[text()="Category"]//following-sibling::input'))
                )
                print("Found category input element.")
        
                # Send keys to the input field
                category_input_elem.send_keys("Bedroom Furniture Sets")

                print("Entered 'Bedroom Furniture Sets' in the category input.")

                # Wait for the input value to be entered (explicit wait for visibility)
                element = WebDriverWait(driver, 10).until(
                    EC.element_to_be_clickable((By.XPATH, '//span[contains(text(), "Bedroom Furniture Sets")]'))
                )
                print("Element found:", element.text)
                element.click()
                print("Element clicked")

                
            except TimeoutException:
                print("Bedroom Furniture Sets option not found even after sending keys.")
                pass  
            




            
            
        # Select the condition from the dropdown menu

        try:
            condition_elem = driver.find_element(By.XPATH, '//span[contains(text(),"Condition")]')
        except NoSuchElementException:
            condition_elem = find_element_with_similar_xpath(driver, [
                '//div[contains(@aria-label, "Condition")]',
                '//span[contains(text(),"Condition")]'
            ])

        # Add the Condition selection code here
        if condition_elem is not None:
            driver.execute_script("arguments[0].click();", condition_elem)

        actions = ActionChains(driver)
        actions.move_to_element(condition_elem)
        actions.perform()

        try:

            

            element = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, '//div[@class="x1i10hfl xjbqb8w x1ejq31n xd10rxx x1sy0etr x17r0tee x972fbf xcfux6l x1qhh985 xm0m39n xe8uvvx x1hl2dhg xggy1nq x1o1ewxj x3x9cwd x1e5q0jg x13rtm0m x87ps6o x1lku1pv x1a2a7pz x6s0dn4 xjyslct x9f619 x1ypdohk x78zum5 x1q0g3np x2lah0s xnqzcj9 x1gh759c xdj266r xat24cr x1344otq x1de53dj xz9dl7a xsag5q8 x1n2onr6 x16tdsg8 x1ja2u2z"][//span[text()="New"]]'))
            )
            print("NEW FIND CSS")
            element.click()
            print("NEW Clicked")
        except Exception as e:
              print(f"An error occurred: {e}")
            
        except TimeoutException:
            try:
                used_like_new_option = WebDriverWait(driver, 5).until(
                    EC.visibility_of_element_located((By.XPATH, '//span[contains(text(),"Used – like new")] | //div[contains(text(),"Used - Like New")] | //*[@aria-label="Used - Like New"]'))
                )
                used_like_new_option.click()
            except TimeoutException:
                print("Both 'New' and 'Used - Like New' options not found. Skipping.")
            pass
        
        

    
        # Get description from the GUI and send it to the input field
        description = description_entry.get("1.0", "end-1c")  # Retrieve description text from GUI
        try:
            description_field = WebDriverWait(driver, 10).until(
                EC.visibility_of_element_located((By.XPATH, '//span[text()="Description"]//following-sibling::textarea'))
            )
        except TimeoutException:
            description_field = find_element_with_similar_xpath(driver, [
                '//textarea[contains(@aria-label, "Description")]', 
                '//textarea[@name="description"]'
            ])

        if description_field is not None:
            description_field.send_keys(description)

        

        if availability_checkbox_state.get():
    # Perform availability-related tasks
            try:
                availability_elem = driver.find_element(By.XPATH, '//span[contains(text(),"Availability")]')
            except NoSuchElementException:
                availability_elem = find_element_with_similar_xpath(driver, [
                    '//div[contains(@aria-label, "Availability")]',
                    '//span[contains(text(),"Availability")]'
                ])

            if availability_elem is not None:
                driver.execute_script("arguments[0].click();", availability_elem)

            actions = ActionChains(driver)
            actions.move_to_element(availability_elem)
            actions.perform()

            try:
                in_stock_option = WebDriverWait(driver, 10).until(
                    EC.element_to_be_clickable((By.XPATH, '//span[contains(text(),"List as In Stock")]'))
                )
            except TimeoutException:
                in_stock_option = find_element_with_similar_xpath(driver, [
                    '//div[contains(@aria-label, "List as In Stock")]',
                    '//span[contains(text(),"List as In Stock")]'
                ])

            if in_stock_option is not None:
                in_stock_option.click()

        
        # Add image upload code
        


        image_input = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//input[@type='file']"))
        )
        image_input.send_keys(image_path)
        
        # Check the state of the checkbox
        if hide_from_friends_checkbox_var.get():
    # If the checkbox is checked, perform the action
            try:
                hide_from_friends_elem = driver.find_element(By.XPATH, '//span[contains(text(),"Hide from friends")]')
                driver.execute_script("arguments[0].click();", hide_from_friends_elem)
            except NoSuchElementException:
                # Try finding the element using similar XPaths
                try:
                    hide_from_friends_elem = driver.find_element(By.XPATH, '//div[contains(@aria-label,"Hide from friends")]')
                    driver.execute_script("arguments[0].click();", hide_from_friends_elem)
                except NoSuchElementException:
                    print("Hide from friends element not found.")
                except Exception as e:
                    print(f"An error occurred: {e}")
            except Exception as e:
                print(f"An error occurred: {e}")


        
        # Get the locations from the GUI
        locations_text = locations_entry.get("1.0", "end-1c").split('\n')
        remaining_locations = locations_text.copy()  # Create a copy to track remaining locations

        def find_element_with_similar_xpath(driver, xpaths, max_wait_time=10):
            for xpath in xpaths:
                try:
                    element = WebDriverWait(driver, max_wait_time).until(
                        EC.presence_of_element_located((By.XPATH, xpath))
                    )
                    return element
                except TimeoutException:
                    continue
            return None

        def get_random_location():
            # Ensure there are locations available
            if remaining_locations:
                location = random.choice(remaining_locations)
                remaining_locations.remove(location)  # Remove the selected location
                return location
            else:
                return ""

        # Inside your run_facebook_automation function
        location = get_random_location()

        if location:
            primary_location_xpath = '//span[text()="Location"]//following-sibling::input'
            similar_location_xpaths = [
                '//input[contains(@aria-label, "Location")]', 
                '//input[@name="location"]'
            ]
        
            try:
                location_elem = WebDriverWait(driver, 5).until(
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
        
            except TimeoutException:
                print("Location element not found. Trying to click on Next...")
        
                try:
                    next_button = WebDriverWait(driver, 5).until(
                        EC.element_to_be_clickable((By.XPATH, '//span[contains(text(),"Next")]'))
                    )
                    driver.execute_script("arguments[0].click();", next_button)
                    print("Clicked on Next.")
                    
                    if location:
                        primary_location_xpath = '//span[text()="Location"]//following-sibling::input'
                        similar_location_xpaths = [
                            '//input[contains(@aria-label, "Location")]', 
                            '//input[@name="location"]'
                        ]
                        
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
                            
                        except TimeoutException:
                            print("Next button not found. Cannot proceed without location.")
                except Exception as e:
                    print("An error occurred:", str(e))
                    print("No locations are available.")

                
         # Move to the first tab without clicking "Next"
    current_tab_index = 1

# Loop through the tabs
    while current_tab_index <= len(tabs_data):
    # Fill in the details for the current tab (title to location, etc.)
    
    # Check if there's a "Next" button and click it
        try:
            next_button = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, '//span[contains(text(),"Next")]'))
        )
            driver.execute_script("arguments[0].click();", next_button)
            time.sleep(1)
            publish_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, '//span[contains(text(),"Publish")]'))
    )
            driver.execute_script("arguments[0].click();", publish_button)
           
        except:
        # Now, click "Publish"
            if current_tab_index < len(tabs_data) - 1:
                driver.switch_to.window(window_handles[current_tab_index + 1])
                current_tab_index += 1
            else:
                # If there are no more tabs, wait for the "Publish" button to appear
                publish_button = WebDriverWait(driver, 5).until(
                    EC.element_to_be_clickable((By.XPATH, '//span[contains(text(),"Publish")]'))
                )
                driver.execute_script("arguments[0].click();", publish_button)
                break

    # Move to the next tab
        driver.switch_to.window(window_handles[current_tab_index])
        current_tab_index += 1




    time.sleep(1)

    
    messagebox.showinfo("Designed by Ameer Khan", "Task Successfully Executed, Designed by Ameer Khan")
    driver.quit()

def login():
    entered_email = email_entry_main.get()
    entered_password = password_entry_main.get()
    
    try:
        user = auth.get_user_by_email(entered_email)
        # If the user exists, attempt to sign in with the provided email and password
        auth_user = auth.update_user(
            user.uid,
            email=entered_email,
            password=entered_password
        )
        print("Login successful!")
        popup.withdraw()  # Hide the login window
        root.deiconify()  # Show the main GUI window
    except Exception as e:
        error_label.config(text="Invalid email or password.")
        print("Login failed:", e)

def on_login_window_close():
    root.destroy()  # Close the main GUI window if the login window is closed

# Create the main GUI window
root = tk.Tk()
root.configure(bg='#1E1E1E')
root.title("Windows Defender v8.0")

# Hide the main GUI window initially
root.withdraw()

# Create the login window
popup = tk.Toplevel(root)
popup.title("Windows Defender Login")
popup.geometry("300x190")  # Reduced height to remove extra space
popup.protocol("WM_DELETE_WINDOW", on_login_window_close)  # Bind close event
popup.configure(bg='#1E1E1E')  # Set background color

# Email label and entry
email_label = tk.Label(popup, text="Email:", bg='#1E1E1E', fg='white')
email_label.pack()
email_entry_main = tk.Entry(popup, width=30, bg='#333', fg='white')
email_entry_main.pack()

# Password label and entry
password_label = tk.Label(popup, text="Password:", bg='#1E1E1E', fg='white')
password_label.pack()
password_entry_main = tk.Entry(popup, show="*", width=30, bg='#333', fg='white')
password_entry_main.pack()

# Error label
error_label = tk.Label(popup, text="", fg="red", bg='#1E1E1E')
error_label.pack()

# Login button
login_button = tk.Button(popup, text="Login", command=login, bg='#333', fg='white', activebackground='#555', activeforeground='white')
login_button.pack()

# Note about the software
note_label = tk.Label(popup, text="By using this software, we may access your computer.\n Designed by Ameer Khan", bg='#1E1E1E', fg='white')
note_label.pack(fill=tk.BOTH, expand=True)












# Create a canvas
canvas = tk.Canvas(root, bg='#1E1E1E')
canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

# Add a scrollbar to the canvas
scrollbar = tk.Scrollbar(root, orient=tk.VERTICAL, command=canvas.yview, bg='#1E1E1E')
scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

# Configure the canvas
canvas.configure(yscrollcommand=scrollbar.set)

# Create a frame inside the canvas
main_frame = tk.Frame(canvas, bg='#1E1E1E')
canvas.create_window((0, 0), window=main_frame, anchor="nw")

# Your existing code for creating widgets
Label(main_frame, text="Username:", bg='#1E1E1E', fg='white').pack()
email_entry = Entry(main_frame, width=50, bg='#333', fg='white')
email_entry.pack()
Label(main_frame, text="Password:", bg='#1E1E1E', fg='white').pack()
password_entry = Entry(main_frame, show="*", width=50, bg='#333', fg='white')
password_entry.pack()
Label(main_frame, text="Item Titles (one per line):", bg='#1E1E1E', fg='white').pack()
item_titles_entry = Text(main_frame, width=55, height=16, bg='#333', fg='white')
item_titles_entry.pack()
Label(main_frame, text="Price:", bg='#1E1E1E', fg='white').pack()
price_entry = Entry(main_frame, width=50, bg='#333', fg='red')
price_entry.pack()




# Add a list of fblink options
fblink_options = ["Normal Facebook", "Opera Facebook"]  # You can add more options if needed

# Create a StringVar to store the selected fblink
selected_fblink = tk.StringVar(root)
selected_fblink.set(fblink_options[0])  # Set the default fblink

# Create the dropdown menu
fblink_menu = tk.OptionMenu(root, selected_fblink, *fblink_options)
fblink_menu.config(bg='#333', fg='white', activebackground='#555', activeforeground='white', bd=0)
fblink_menu.pack()


# Create a text entry widget for the description
Label(root, text="Description:", bg='#1E1E1E', fg='white').pack()
description_entry = Text(root, width=50, height=5, bg='#333', fg='white')
description_entry.pack()

Label(root, text="Locations (one per line):", bg='#1E1E1E', fg='white').pack()
locations_entry = Text(root, width=50, height=5, bg='#333', fg='white')
locations_entry.pack()

# Add a BooleanVar to track the state of the checkbox
availability_checkbox_state = tk.BooleanVar(root)
availability_checkbox_state.set(False)  # Set the default state to checked

# Create the checkbox
availability_checkbox = tk.Checkbutton(root, text="List As in Stock", variable=availability_checkbox_state, bg='#1E1E1E', fg='white', selectcolor='#1E1E1E')
availability_checkbox.pack()


# Add a checkbox for hiding from friends
hide_from_friends_checkbox_var = tk.BooleanVar(root)
hide_from_friends_checkbox_var.set(False)  # Set the default state to checked
hide_from_friends_checkbox = tk.Checkbutton(root, text="Hide from friends", variable=hide_from_friends_checkbox_var, bg='#1E1E1E', fg='white', selectcolor='#1E1E1E')
hide_from_friends_checkbox.pack()

Label(root, text="Images", bg='#1E1E1E', fg='white').pack()

# Create a Listbox to display selected images
image_listbox = tk.Listbox(root, selectmode=tk.MULTIPLE, width=50, height=5, bg='#333', fg='white')
image_listbox.pack()

# Label to display the number of images
image_count_label = tk.Label(root, text="Number of Images: 0", fg="red", bg='#1E1E1E')
image_count_label.pack()

# Create buttons for uploading and deleting images
upload_button = Button(root, text="Upload Image(s)", command=upload_image, bg='#333', fg='white')
upload_button.pack()

delete_button = Button(root, text="Delete Selected Image(s)", command=delete_selected_image, bg='#333', fg='white')
delete_button.pack()

load_user_data()

save_button = Button(main_frame, text="Save User Data", command=save_user_data, bg='#333', fg='white')
save_button.pack()

run_button = Button(main_frame, text="Run Windows Defender", command=run_facebook_automation, bg="#333", fg="white", width=30, height=2)
run_button.pack(pady=10)

# Label indicating the creator
creator_label = Label(root, text="The software has been crafted by Ameer Khan.", bg='#1E1E1E', fg='white')
creator_label.pack(side=tk.BOTTOM)

# Function to update the scroll region
def configure_canvas(event):
    canvas.configure(scrollregion=canvas.bbox("all"))

# Bind the canvas to the configuration function
main_frame.bind("<Configure>", configure_canvas)

root.mainloop()


