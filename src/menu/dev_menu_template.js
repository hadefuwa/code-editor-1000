import { BrowserWindow } from "electron";
import path from "path";
import url from "url";

export default {
  label: "Developer",
  submenu: [
    // Home Button
    {
      label: "Home", // Home menu item
      accelerator: "CmdOrCtrl+H", // Optional shortcut to go Home
      click: () => {
        const focusedWindow = BrowserWindow.getFocusedWindow();
        if (focusedWindow) {
          // Load the home page (assuming it's 'app.html')
          focusedWindow.loadURL(
            url.format({
              pathname: path.join(__dirname, "app.html"), // Update this path to your actual home page
              protocol: "file:",
              slashes: true
            })
          );
        }
      }
    },
    // Toggle Developer Tools
    {
      label: "Toggle Developer Tools",
      accelerator: "CmdOrCtrl+Shift+I", // Shortcut to open DevTools
      click: () => {
        const focusedWindow = BrowserWindow.getFocusedWindow();
        if (focusedWindow) {
          focusedWindow.webContents.toggleDevTools(); // Open or close DevTools
        }
      }
    }
  ]
};
