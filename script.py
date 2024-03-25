import tkinter as tk
import time

def change_color(root):
    colors = ['red', 'green', 'blue', 'yellow', 'orange', 'purple']
    for color in colors:
        root.configure(background=color)
        root.update()
        time.sleep(0.5)

def main():
    # Create the main window
    root = tk.Tk()
    root.title("Simple GUI")

    # Add a label with a description
    description_label = tk.Label(root, text="This is a simple GUI created using Tkinter.")
    description_label.pack(pady=20)

    # Add buttons
    button_frame = tk.Frame(root)
    button_frame.pack(pady=10)

    change_color_button = tk.Button(button_frame, text="Change Color", command=lambda: change_color(root))
    change_color_button.pack(side=tk.LEFT, padx=5)

    quit_button = tk.Button(button_frame, text="Quit", command=root.quit)
    quit_button.pack(side=tk.LEFT, padx=5)

    # Run the main event loop
    root.mainloop()

if __name__ == "__main__":
    main()