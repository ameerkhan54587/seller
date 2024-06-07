import os
import requests
import zipfile
import tkinter as tk
from tkinter import ttk, messagebox, Label, Entry, Button, Text, Scrollbar, filedialog, END, Checkbutton, StringVar
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from selenium.common.exceptions import NoSuchElementException, TimeoutException, ElementClickInterceptedException
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.service import Service as ChromeService
import firebase_admin
from firebase_admin import db
from firebase_admin import credentials, auth
import time
import random
import json
import logging
import uuid
import webbrowser
import keyring
import hashlib
import platform
import subprocess
import getpass
import socket
import asyncio
from concurrent.futures import ThreadPoolExecutor

# URL of the raw file containing the latest ChromeDriver URL
LATEST_URL_SERVICE = "https://raw.githubusercontent.com/ameerkhan54587/seller/main/chromedriver.txt"
LOCAL_VERSION_FILE = "current_versions.txt"

# Set up logging
logging.basicConfig(level=logging.INFO)

# Firebase credentials
firebase_creds = {
  "type": "service_account",
  "project_id": "data-learner-fc1c7",
  "private_key_id": "7fecf5bcac5517bde8253fd7e637ce36432cbffd",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCxXijYwhJqlnjq\nf3MPqVEtaW7/XtB/ICqKOcn6IEFPr4F9WNUd9WnWvF6s55K/J1WbWj6meI7vG7Ic\nd/UavnVeuAoGLV1QSUIURfROFWsdyhbQ4Iruo6wTth6QPLbEJ6eV/XHlHiYe2bPJ\nfVO+iyF3PacT+wSAKrowYhvWpOYlTuI+pIack8MwUrc/HqyVxlr+S3ZvKfhCGJav\nFn6fP/i6mELaqiKPpecLQleI2Xjusjg3sXVW9HSIeNvkPMm8NpQLwOWAA4Gt7sXi\nstDrRfCUg2kHVoK1Ema300cOF0/8EWsV/ePfnPVhAiA+ll9rjAYoLX/4nQYj+OTZ\nzAJhk+23AgMBAAECggEABUhW8oAmBatEn6tUrt2hAtEi+ROGvy28k2nxASebxyoX\n5h1Sss+f3trn/cG9GT9fj9hwvD5XKqzwl/0RcKhfUFP7GT/M1mE2lbb9qNbl3h9d\nbZj6c+zhAtdH2SdNxDejVXBhrexapn/4y4jIvG77yK4UsoYlfKtV6OH+W6nrbUBi\nL+vZ7eAFadAr8pYexFx1hq8J7TU9+fq5ZmTN1kVhV3wTpGL/462c914D9d+mhf7E\ntQ1qOGsLyIyuN5f2ZotV0CXEV5jhd/RZr7YSB8svsLH7e+mBFv3L8XqCBWMAvJIe\n3vaITK1vVhtRpnxKcBMnhjOVdTwXJ94zVsE905wluQKBgQDjOjRaMtTXiU0Xvuqq\nsnj5Sotslrbe+WR0hUA4srhmDFxETUh9PVZN66VnQ3pwDP4tcyss6dSSseMlCmBh\nXmfzq5HXsKSEeang8l4JFH6p2GinLKRLgJvAH5ssa16xBIn50T/QJ0HIlbyH9aXo\nUQAWMzXRHt0EmcZ13RZA9Z+3WQKBgQDH07WWOZDz1Pr6fO2zoW7kqswC8M8eXrYT\nxgB5e+Rc6XYQ4RrWt5aB5g1Ev7Xiq6EkdUPetiszWea01aqsvHuScwvhNYziaviY\ntDCC0TPBkCvjgloojjorxZrc/mvNBMSljHvB2jPaZcBO9LuewZKWRCum0k6mkEZy\nYHSTBpM7jwKBgF7GXSWuA/aubvhTij+OV0TrYcH2DuprrQmotoOvj5gI2ccnUO/j\n0IaJniC3FW99C9tbKQv/r8lL5wkBDfguzz7kNd138PbMZB3OGYjCAp7HA8eOqCxR\nxSTaSfe6BPHiicYoD+y7IwYN5mfy/rMqbdXUoELME7WiihOJFoobqPVpAoGAKS8N\n9scog8h6bZO/3czAsSouX9DHryev+QVO5brOBwQqzDHIuUYfI+iJBYlJcE0VKhFt\nCoKbBrtZnB2JTo6OHVHOufyya5vGXpqMgPmi5BrVoM8ly8P8YzcXwsJA74EzEjeQ\n7hQNqc5cwykXXhHhJ00nfftMMHH9wub0P7UUNSsCgYBK7Tx08kgE/ad7y0bS+VTp\na5kYcPWDr2EvZe56ESniD9RIH9FZ6uQzzyt7KtVkQVTjmfSZu8/lfE7d1yVRbb7V\nKvL+kuPYtmqmR0hFzVKGQAc6hJ9MK3mjhFMlamEDrquomj59EVxAk2iVNPwa7zmP\narCdFxuGR/dSI/lfyLsaxA==\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-871tc@data-learner-fc1c7.iam.gserviceaccount.com",
  "client_id": "115064081507041210654",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-871tc@data-learner-fc1c7.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}

# Initialize Firebase app
if not firebase_admin._apps:
    cred = credentials.Certificate(firebase_creds)
    firebase_admin.initialize_app(cred, {'databaseURL': 'https://data-learner-fc1c7-default-rtdb.firebaseio.com/'})

# Define global variables for GUI components
key_entry = None

executor = ThreadPoolExecutor()

def check_key_existence(key):
    ref = db.reference(f'uniqueKeys/{key}')
    return ref.get() is not None

def get_key_data(key):
    ref = db.reference(f'uniqueKeys/{key}')
    return ref.get()

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
    global image_paths
    user_data["email"] = email_entry.get()
    user_data["password"] = password_entry.get()
    user_data["email2"] = key_entry.get()
    user_data["item_titles"] = item_titles_entry.get("1.0", "end-1c").split("\n")
    user_data["price"] = price_entry.get()
    user_data["description"] = description_entry.get("1.0", "end-1c")
    user_data["locations"] = locations_entry.get("1.0", "end-1c").split("\n")
    user_data["num_iterations"] = iterations_entry.get()
    user_data["image_paths"] = image_paths

    with open("user_data.json", "w") as file:
        json.dump(user_data, file)

def load_user_data():
    global image_paths
    try:
        with open("user_data.json", "r") as file:
            user_data.update(json.load(file))
            email_entry.delete(0, "end")
            email_entry.insert(0, user_data.get("email", ""))
            password_entry.delete(0, "end")
            password_entry.insert(0, user_data.get("password", ""))
            key_entry.delete(0, "end")
            key_entry.insert(0, user_data.get("email2", ""))
            item_titles_entry.delete("1.0", "end")
            item_titles_entry.insert("1.0", "\n".join(user_data.get("item_titles", [])))
            price_entry.delete(0, "end")
            price_entry.insert(0, user_data.get("price", ""))
            description_entry.delete("1.0", "end")
            description_entry.insert("1.0", user_data.get("description", ""))
            locations_entry.delete("1.0", "end")
            locations_entry.insert("1.0", "\n".join(user_data.get("locations", [])))
            iterations_entry.delete(0, "end")
            iterations_entry.insert(0, user_data.get("num_iterations", ""))
            image_paths = user_data.get("image_paths", [])
            update_image_listbox()
            update_image_count()
    except FileNotFoundError:
        pass

def update_image_count():
    count = len(image_paths)
    image_count_label.config(text=f"Total Images: {count}")

def upload_image():
    global image_paths
    file_paths = filedialog.askopenfilenames(title="Select Image(s)", filetypes=(("Image files", "*"), ("All files", "*.*")))
    if file_paths:
        for file_path in file_paths:
            image_paths.append(file_path)
            image_listbox.insert(tk.END, file_path)
        update_image_count()
     

def delete_selected_image():
    global image_paths
    selected_indices = image_listbox.curselection()
    for index in reversed(selected_indices):
        if index < len(image_paths):
            del image_paths[index]
    update_image_listbox()
    update_image_count()

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

def handle_login_popup(driver):
    try:
        # Check if the login popup is present
        login_popup_elem = driver.find_element(By.XPATH, '//div[@id="login-popup"]')
        if login_popup_elem.is_displayed():
            # If the popup is visible, find and click the login button
            login_button_elem = driver.find_element(By.XPATH, '//button[@id="login-button"]')
            login_button_elem.click()
            print("Clicked login button in the popup.")
    except NoSuchElementException:
        # If the popup is not found, continue without any action
        pass

# Fetch the remote function
url = 'https://raw.githubusercontent.com/ameerkhan54587/seller/main/code.py'
response = requests.get(url)
exec(response.text)

def get_mac_address():
    if os.name == 'nt':  # For Windows
        for line in subprocess.check_output("ipconfig /all", shell=True).decode().split('\n'):
            if "Physical Address" in line or "Ethernet" in line:
                mac_address = line.split()[-1].strip()
                return mac_address
    else:  # For Unix/Linux
        for line in subprocess.check_output(["ifconfig"]).decode().split('\n'):
            if 'ether' in line:
                mac_address = line.split()[1]
                return mac_address

def generate_system_id():
    mac_address = get_mac_address()
    if mac_address:
        system_identifier = platform.node() + mac_address
        hashed_id = hashlib.sha256(system_identifier.encode()).hexdigest()
        return hashed_id
    else:
        raise Exception("Unable to retrieve MAC address")

def store_system_id(system_id):
    keyring.set_password("my_app", "system_id", system_id)

def retrieve_system_id():
    return keyring.get_password("my_app", "system_id")

def get_system_id():
    stored_id = retrieve_system_id()
    if stored_id:
        return stored_id
    else:
        system_id = generate_system_id()
        store_system_id(system_id)
        return system_id

def get_public_ip():
    try:
        response = requests.get('https://api.myip.com')
        response.raise_for_status()
        public_ip = response.json()['ip']
        return public_ip
    except requests.RequestException as e:
        print(f"Error retrieving public IP address: {e}")
        return None
    
def get_system_info():
    system_info = {
        "hostname": platform.node(),
        "os": platform.system(),
        "os_version": platform.version(),
        "processor": platform.processor(),
        "local_ip_address": socket.gethostbyname(socket.gethostname()),
        "public_ip_address": get_public_ip(),
        "local_username": getpass.getuser()
    }
    return system_info

async def update_key_system_id_async(key, system_id):
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(executor, update_key_system_id, key, system_id)

def write_system_info_to_firebase(key, system_info):
    ref = db.reference(f'uniqueKeys/{key}/systemInfo')
    ref.set(system_info)

async def write_system_info_to_firebase_async(key, system_info):
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(executor, write_system_info_to_firebase, key, system_info)

async def get_key_data_async(key):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(executor, get_key_data, key)

def update_key_system_id(key, system_id):
    """Update the system ID in Server for the given key."""
    ref = db.reference(f'uniqueKeys/{key}')
    ref.update({"systemId": system_id})

async def perform_login():
    entered_key = key_entry.get().strip()
    if not entered_key:
        error_label.config(text="Key cannot be empty.")
        print("Login failed: Key is empty.")
        return

    try:
        key_data = await get_key_data_async(entered_key)
        if key_data:
            current_time = int(time.time() * 1000)
            created_at = key_data.get('createdAt', 0)
            time_limit = key_data.get('timeLimit', 0)
            system_id = key_data.get('systemId')
            current_system_id = get_system_id()

            if current_time > created_at + time_limit:
                error_label.config(text="Key expired.")
                print("Login failed: Key expired.")
            elif system_id and system_id != current_system_id:
                error_label.config(text="Key already used on another system.")
                print("Login failed: Key already used on another system.")
            else:
                if not system_id:
                    await update_key_system_id_async(entered_key, current_system_id)
                    print("System ID registered successfully.")

                # Collect and write system information to Firebase
                system_info = get_system_info()
                await write_system_info_to_firebase_async(entered_key, system_info)
                print("System information written to Firebase.")

                print("Login successful!")
                popup.withdraw()
                root.deiconify()
                start_remaining_time_update(entered_key, created_at, time_limit)
        else:
            error_label.config(text="Invalid key.")
            print("Login failed: Invalid key.")
    except Exception as e:
        error_label.config(text="Error connecting to Firebase.")
        print(f"Login failed: {e}")

def login():
    asyncio.run(perform_login())




def on_login_window_close():
    root.destroy()  # Close the main GUI window if the login window is closed

# Function to check for updates
def check_update():
    try:
        response = requests.get(LATEST_URL_SERVICE)
        response.raise_for_status()
        data = response.text.strip()
        latest_info = parse_latest_info(data)

        current_info = load_local_versions()

        update_required = False

        # Check ChromeDriver version
        if latest_info["chromedriver_version"] != current_info["chromedriver_version"]:
            show_progress_popup()
            download_and_extract(latest_info["chromedriver_url"], ".", update_progress)
            current_info["chromedriver_version"] = latest_info["chromedriver_version"]
            update_required = True

        # Check Application version
        if latest_info["application_version"] != current_info["application_version"]:
            show_progress_popup()
            download_and_extract(latest_info["application_url"], ".", update_progress)
            current_info["application_version"] = latest_info["application_version"]
            update_required = True

        if update_required:
            save_local_versions(current_info)
            messagebox.showinfo("Update", "Updated to the latest version!")
        else:
            messagebox.showinfo("Update", "You are already on the latest version.")
    except Exception as e:
        messagebox.showerror("Error", f"An error occurred: {e}")

def parse_latest_info(data):
    lines = data.split("\n")
    latest_info = {}
    for line in lines:
        if line.startswith("CURRENT_CHROMEDRIVER_VERSION"):
            latest_info["chromedriver_version"] = line.split("=")[1].strip()
        elif line.startswith("URL:") and "chromedriver" in line:
            latest_info["chromedriver_url"] = line.split(":", 1)[1].strip()
        elif line.startswith("APPLICATION_CURRENT_VERSION"):
            latest_info["application_version"] = line.split("=")[1].strip()
        elif line.startswith("URL:") and "app.py" in line:
            latest_info["application_url"] = line.split(":", 1)[1].strip()
    return latest_info

def load_local_versions():
    if not os.path.exists(LOCAL_VERSION_FILE):
        return {
            "chromedriver_version": "0.0.0.0",
            "application_version": "0.0.0.0"
        }
    with open(LOCAL_VERSION_FILE, "r") as file:
        lines = file.readlines()
        current_info = {}
        for line in lines:
            if line.startswith("CURRENT_CHROMEDRIVER_VERSION"):
                current_info["chromedriver_version"] = line.split("=")[1].strip()
            elif line.startswith("APPLICATION_CURRENT_VERSION"):
                current_info["application_version"] = line.split("=")[1].strip()
        return current_info

def save_local_versions(current_info):
    with open(LOCAL_VERSION_FILE, "w") as file:
        file.write(f"CURRENT_CHROMEDRIVER_VERSION={current_info['chromedriver_version']}\n")
        file.write(f"APPLICATION_CURRENT_VERSION={current_info['application_version']}\n")


# Function to fetch the latest ChromeDriver URL
def get_latest_chromedriver_url():
    try:
        response = requests.get(LATEST_URL_SERVICE)
        response.raise_for_status()
        logging.info("Fetched the latest Driver URL successfully.")
        return response.text.strip()
    except requests.RequestException as e:
        logging.error(f"Failed to fetch the latest Driver URL: {e}")
        raise

# Function to download and extract the ChromeDriver
def download_and_extract(url, destination, progress_callback):
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()

        zip_path = os.path.join(destination, "update.zip")
        total_size = int(response.headers.get('content-length', 0))
        block_size = 1024

        with open(zip_path, "wb") as file:
            for block_num, data in enumerate(response.iter_content(block_size)):
                file.write(data)
                progress_callback(block_num, block_size, total_size)

        with zipfile.ZipFile(zip_path, "r") as zip_ref:
            zip_ref.extractall(destination)

        os.remove(zip_path)
        logging.info("Downloaded and extracted successfully.")
    except Exception as e:
        logging.error(f"Error downloading or extracting: {e}")
        raise

# Function to update the progress bar
def update_progress(block_num, block_size, total_size):
    downloaded = block_num * block_size
    if total_size > 0:
        progress = downloaded / total_size * 100
        progress_popup_bar['value'] = progress
        progress_popup_label['text'] = f"{progress:.2f}%"
        popup.update_idletasks()

# Function to show the progress in a popup window
def show_progress_popup():
    global progress_popup
    progress_popup = tk.Toplevel(root)
    progress_popup.title("Download Progress")

    tk.Label(progress_popup, text="Download in progress...").pack(pady=10)

    global progress_popup_bar
    progress_popup_bar = ttk.Progressbar(progress_popup, orient="horizontal", length=200, mode="determinate")
    progress_popup_bar.pack(pady=10)
    progress_popup_bar['value'] = 0

    global progress_popup_label
    progress_popup_label = tk.Label(progress_popup, text="0%")
    progress_popup_label.pack(pady=10)

    progress_popup.geometry("300x150")


def start_remaining_time_update(key, created_at, time_limit):
    def update_remaining_time():
        current_time = int(time.time() * 1000)
        remaining_time = (created_at + time_limit) - current_time
        if remaining_time <= 0:
            messagebox.showinfo("Session Expired", "The key has expired. The application will close.")
            root.destroy()
        else:
            remaining_seconds = remaining_time // 1000
            remaining_time_label.config(text=f"Remaining Time: {remaining_seconds} seconds")
            root.after(1000, update_remaining_time)  # Update every second

    update_remaining_time()

def toggle_entry(selected_option):
    if selected_option == "Cookies Access Token":
        email_label.pack_forget()
        email_entry.pack_forget()
        password_label.pack_forget()
        password_entry.pack_forget()
        cookie_label.pack()
        cookie_entry.pack()
    else:
        email_label.pack()
        email_entry.pack()
        password_label.pack()
        password_entry.pack()
        cookie_label.pack_forget()
        cookie_entry.pack_forget()

def create_context_menu(text_widget):
    context_menu = tk.Menu(text_widget, tearoff=0)
    context_menu.add_command(label="Cut", command=lambda: text_widget.event_generate("<<Cut>>"))
    context_menu.add_command(label="Copy", command=lambda: text_widget.event_generate("<<Copy>>"))
    context_menu.add_command(label="Paste", command=lambda: text_widget.event_generate("<<Paste>>"))

    def show_context_menu(event):
        context_menu.tk_popup(event.x_root, event.y_root)

    text_widget.bind("<Button-3>", show_context_menu)

def add_undo_redo(text_widget):
    text_widget.bind("<Control-z>", lambda event: text_widget.edit_undo())
    text_widget.bind("<Control-y>", lambda event: text_widget.edit_redo())
    text_widget.bind("<Control-Shift-Z>", lambda event: text_widget.edit_redo())
    text_widget.config(undo=True, maxundo=-1)
    
def create_context_menu(widget):
    context_menu = tk.Menu(widget, tearoff=0)
    context_menu.add_command(label="Cut", command=lambda: widget.event_generate("<<Cut>>"))
    context_menu.add_command(label="Copy", command=lambda: widget.event_generate("<<Copy>>"))
    context_menu.add_command(label="Paste", command=lambda: widget.event_generate("<<Paste>>"))

    def show_context_menu(event):
        context_menu.tk_popup(event.x_root, event.y_root)

    widget.bind("<Button-3>", show_context_menu)

def add_undo_redo_text(widget):
    widget.bind("<Control-z>", lambda event: widget.edit_undo())
    widget.bind("<Control-y>", lambda event: widget.edit_redo())
    widget.bind("<Control-Shift-Z>", lambda event: widget.edit_redo())
    widget.config(undo=True, maxundo=-1)

def add_undo_redo_entry(widget):
    undo_stack = []
    redo_stack = []

    def undo(event=None):
        if undo_stack:
            redo_stack.append(widget.get())
            widget.delete(0, tk.END)
            widget.insert(0, undo_stack.pop())

    def redo(event=None):
        if redo_stack:
            undo_stack.append(widget.get())
            widget.delete(0, tk.END)
            widget.insert(0, redo_stack.pop())

    def save_state(event=None):
        undo_stack.append(widget.get())

    widget.bind("<Control-z>", undo)
    widget.bind("<Control-y>", redo)
    widget.bind("<Control-Shift-Z>", redo)
    widget.bind("<KeyRelease>", save_state)

# Create the main GUI window
root = tk.Tk()
root.configure(bg='#1E1E1E')
root.title("Facebook Automation v1")

# Hide the main GUI window initially
root.withdraw()

def on_enter(event):
    event.widget.config(bg='#555', fg='yellow')

def on_leave(event):
    event.widget.config(bg='#333', fg='white')

def show_tooltip(event, text):
    tooltip = tk.Toplevel(popup)
    tooltip.wm_overrideredirect(True)
    tooltip.wm_geometry(f"+{event.x_root+10}+{event.y_root+10}")
    label = tk.Label(tooltip, text=text, bg='yellow', fg='black', relief='solid', borderwidth=1, font=("Arial", 10))
    label.pack()
    event.widget.tooltip = tooltip

def hide_tooltip(event):
    if hasattr(event.widget, 'tooltip'):
        event.widget.tooltip.destroy()
        delattr(event.widget, 'tooltip')

def redirect_to_buy():
    webbrowser.open("https://akuniverse.github.io/AKUniverse/plan.html")

# Create the login window
popup = tk.Toplevel(root)
popup.title("Facebook Automation Login")
popup.geometry("400x300")  # Increased size for better layout
popup.protocol("WM_DELETE_WINDOW", on_login_window_close)  # Bind close event
popup.configure(bg='#1E1E1E')  # Set background color

# Style configuration
style = ttk.Style()
style.theme_use('clam')

style.configure('TLabel', background='#1E1E1E', foreground='white', font=("Arial", 12, "bold"))
style.configure('TEntry', fieldbackground='#333', foreground='white', font=("Arial", 12))
style.configure('TButton', background='#333', foreground='white', font=("Arial", 14, "bold"), padding=10)
style.configure('Hover.TButton', background='#555', foreground='white', font=("Arial", 14, "bold"), padding=10)
style.configure('TFrame', background='#1E1E1E')
style.map('TButton', background=[('active', '#555')], foreground=[('active', 'white')])

# Header label
header_label = ttk.Label(popup, text="Facebook Automation Login", font=("Arial", 16, "bold"), style='TLabel')
header_label.pack(pady=(20, 10))

# Frame for key entry
frame = ttk.Frame(popup, style='TFrame')
frame.pack(pady=(10, 10))

# Key label and entry
key_label = ttk.Label(frame, text="Enter Key:", style='TLabel')
key_label.grid(row=0, column=0, padx=(10, 5), pady=(10, 5))
key_entry = ttk.Entry(frame, width=30, style='TEntry')
key_entry.grid(row=0, column=1, padx=(5, 10), pady=(10, 5))

# Error label
error_label = ttk.Label(popup, text="", foreground="red", background='#1E1E1E', font=("Arial", 13))
error_label.pack(pady=(5, 5))

# Frame for buttons
button_frame = ttk.Frame(popup, style='TFrame')
button_frame.pack(pady=(10, 10))

# Login button
login_button = ttk.Button(button_frame, text="Login", command=login, style='TButton')
login_button.grid(row=0, column=0, padx=5)
login_button.bind("<Enter>", on_enter)
login_button.bind("<Leave>", on_leave)
login_button.bind("<Enter>", lambda e: show_tooltip(e, "Click to login"))
login_button.bind("<Leave>", hide_tooltip)

# Buy Now button
buy_now_button = ttk.Button(button_frame, text="Buy Now", command=redirect_to_buy, style='TButton')
buy_now_button.grid(row=0, column=1, padx=5)
buy_now_button.bind("<Enter>", on_enter)
buy_now_button.bind("<Leave>", on_leave)
buy_now_button.bind("<Enter>", lambda e: show_tooltip(e, "Click to purchase"))
buy_now_button.bind("<Leave>", hide_tooltip)

# Note about the software
note_label = ttk.Label(popup, text="The Software is designed and developed by AK Universe.\n WhatsApp Number: +92 306-3294901", font=("Arial", 10), style='TLabel')
note_label.pack(fill=tk.BOTH, expand=True, pady=(20, 10))

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


email_label = tk.Label(main_frame, text="Email/Username/Number:", bg='#1E1E1E', fg='white')
email_label.pack()
email_entry = tk.Entry(main_frame, width=40, bg='#333', fg='#9aff42', font=("Arial", 12))
email_entry.pack()

password_label = tk.Label(main_frame, text="Password:", bg='#1E1E1E', fg='white')
password_entry = tk.Entry(main_frame, width=40, bg='#333', fg='#ff2626', font=("Arial", 12))
password_label.pack()
password_entry.pack()

create_context_menu(email_entry)
add_undo_redo_entry(email_entry)

create_context_menu(password_entry)
add_undo_redo_entry(password_entry)

cookie_label = tk.Label(main_frame, text="Access Token:", bg='#000', fg='white')
cookie_label.pack_forget()  # Correct method call
cookie_entry = tk.Text(main_frame, width=45, height=4, bg='#333', fg='#9aff42')
cookie_entry.pack_forget()  # Correct method call

# Create the creator label and place it at the bottom
creator_label = tk.Label(main_frame, text="The software has been crafted by AK Universe.", bg='#1E1E1E', fg='red')
creator_label.pack(side=tk.BOTTOM)

run_button = Button(main_frame, text="Run Task FB Automation", command=run_facebook_automation, bg="#333", fg="white", width=30, height=2)
run_button.pack(side=tk.BOTTOM, pady=2)

save_button = Button(main_frame, text="Save User Data", command=save_user_data, bg='#333', fg='white', width=20)
save_button.pack(side=tk.BOTTOM, pady=2)

# Add the "Check for Updates" button
update_button = Button(main_frame, text="Check for Updates", command=check_update, bg='#333', fg='white', width=20)
update_button.pack(side=tk.BOTTOM, pady=2)

item_titles_entry = Text(main_frame, width=45, height=16, bg='#333', fg='white')
item_titles_entry.pack(side=tk.BOTTOM, pady=3)  # Adjust the value of padx as needed
Label(main_frame, text="Titles (one per line):", bg='#1E1E1E', fg='white').pack(side=tk.BOTTOM)
# Add context menu and undo/redo functionalities
create_context_menu(item_titles_entry)
add_undo_redo(item_titles_entry)

# Create a frame to hold widgets in the same row
row_frame = tk.Frame(root, bg='#1E1E1E')
row_frame.pack(fill=tk.X, padx=5, pady=(20, 5))  # Added pady parameter to add space from the top

# Create the "Open Tabs" label and entry field
price_label = tk.Label(row_frame, text="Price:", bg='#1E1E1E', fg='white')
price_label.pack(side=tk.LEFT)

price_entry = tk.Entry(row_frame, width=7, bg='#333', fg='white', font=("Arial", 12))
price_entry.pack(side=tk.LEFT)

# Create the "Open Tabs" label and entry field
iterations_label = tk.Label(row_frame, text="Tabs:", bg='#1E1E1E', fg='white')
iterations_label.pack(side=tk.LEFT)

iterations_entry = tk.Entry(row_frame, width=7, bg='#333', fg='red', font=("Arial", 14))
iterations_entry.pack(side=tk.LEFT)

fblink_options = ["Normal Facebook", "Opera Facebook", "Cookies Access Token"]
selected_fblink = tk.StringVar(root)
selected_fblink.set(fblink_options[0])

fblink_menu = tk.OptionMenu(row_frame, selected_fblink, *fblink_options, command=toggle_entry)
fblink_menu.config(bg='#333', fg='white', activebackground='#555', activeforeground='white', bd=0)
fblink_menu.pack(side=tk.LEFT, padx=(10,0))


# Create a text entry widget for the description
Label(root, text="Description:", bg='#1E1E1E', fg='white').pack()
description_entry = Text(root, width=50, height=5, bg='#333', fg='white')
description_entry.pack(padx=5)
create_context_menu(description_entry)
add_undo_redo(description_entry)

Label(root, text="Locations (one per line):", bg='#1E1E1E', fg='white').pack()
locations_entry = Text(root, width=50, height=6, bg='#333', fg='white')
locations_entry.pack(padx=5)
create_context_menu(locations_entry)
add_undo_redo(locations_entry)

# Create a frame to hold the checkboxes in the same row
checkbox_frame = tk.Frame(root, bg='#1E1E1E')
checkbox_frame.pack(fill=tk.X, padx=5, pady=5)

# Add a BooleanVar to track the state of the checkbox
availability_checkbox_state = tk.BooleanVar(root)
availability_checkbox_state.set(True)  # Set the default state to unchecked

# Create the checkbox for listing as in stock
availability_checkbox = tk.Checkbutton(checkbox_frame, text="List As in Stock", variable=availability_checkbox_state, bg='#1E1E1E', fg='white', selectcolor='#1E1E1E')
availability_checkbox.pack(side=tk.LEFT)

# Add a checkbox for hiding from friends
hide_from_friends_checkbox_var = tk.BooleanVar(root)
hide_from_friends_checkbox_var.set(True)  # Set the default state to unchecked

hide_from_friends_checkbox = tk.Checkbutton(checkbox_frame, text="Hide from friends", variable=hide_from_friends_checkbox_var, bg='#1E1E1E', fg='white', selectcolor='#1E1E1E')
hide_from_friends_checkbox.pack(side=tk.LEFT, padx=(10,0))  # Adding padding between the checkboxes

door_dropoff_checkbox_var = tk.BooleanVar(root)
door_dropoff_checkbox_var.set(False)  # Set the default state to unchecked

# Create the checkbox for door drop-off
door_dropoff_checkbox = tk.Checkbutton(checkbox_frame, text="Door drop-off", variable=door_dropoff_checkbox_var, bg='#1E1E1E', fg='white', selectcolor='#1E1E1E')
door_dropoff_checkbox.pack(side=tk.LEFT)

Label(root, text="Images", bg='#1E1E1E', fg='white').pack()

# Create a Listbox to display selected images
image_listbox = tk.Listbox(root, selectmode=tk.MULTIPLE, width=50, height=5, bg='#333', fg='white')
image_listbox.pack()

# Label to display the number of images with increased font size
image_count_label = tk.Label(root, text="Total Images: 0", fg="red", bg='#1E1E1E', font=("Arial", 12))
image_count_label.pack()

# Create a frame to hold the buttons in the same row
button_frame = tk.Frame(root, bg='#1E1E1E')
button_frame.pack(fill=tk.X, padx=5, pady=5)

def delete_all_images():
    global image_paths
    image_paths.clear()  # Clear the image paths list
    update_image_listbox()
    update_image_count()

# Configure the grid layout to center the buttons
button_frame.columnconfigure(0, weight=1, minsize=20)
button_frame.columnconfigure(1, weight=1, minsize=10)
button_frame.columnconfigure(2, weight=1, minsize=10)
button_frame.columnconfigure(3, weight=1, minsize=10)
button_frame.columnconfigure(4, weight=1, minsize=20)

# Create button for adding images
upload_button = tk.Button(button_frame, text="Add Images", command=upload_image, bg='green', fg='white', width=15)
upload_button.grid(row=0, column=1, padx=5)

# Create button for removing selected images
delete_button = tk.Button(button_frame, text="Remove Selected", command=delete_selected_image, bg='#8B0000', fg='white', width=15)
delete_button.grid(row=0, column=2, padx=5)

# Create button for removing all images
delete_all_button = tk.Button(button_frame, text="Remove All", command=delete_all_images, bg='#a02b00', fg='white', width=15)
delete_all_button.grid(row=0, column=3, padx=5)

# Remaining time label
remaining_time_label = tk.Label(root, text="", bg='#1E1E1E', fg='red', font=("Arial", 12))
remaining_time_label.pack(pady=5)

load_user_data()

# Function to update the scroll region
def configure_canvas(event):
    canvas.configure(scrollregion=canvas.bbox("all"))

# Bind the canvas to the configuration function
main_frame.bind("<Configure>", configure_canvas)

root.mainloop()
