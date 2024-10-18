import { BrowserWindow } from "electron";
import path from "path";
import url from "url";

export default {
  label: "Help",
  submenu: [
    {
      label: "About Lite", // About Lite menu item
      click: () => {
        const aboutWindow = new BrowserWindow({
          width: 400,
          height: 300,
          title: "About Flowcode Lite",
          webPreferences: {
            nodeIntegration: true
          },
          resizable: false, // Prevent resizing
          minimizable: false, // Prevent minimizing
          maximizable: false // Prevent maximizing
        });
        
        aboutWindow.setMenuBarVisibility(false); // Hide the menu bar
        aboutWindow.loadFile("app/about-lite.html"); // Load the 'About Lite' page
      }
    },
    {
      label: "Flowcode Wiki",
      click: () => {
        BrowserWindow.getFocusedWindow().loadURL("https://www.flowcode.co.uk/wiki"); // Flowcode Wiki URL
      }
    },
    {
      label: "Flowcode Forums",
      click: () => {
        BrowserWindow.getFocusedWindow().loadURL("https://www.flowcode.co.uk/forums"); // Flowcode Forums URL
      }
    },
    {
      label: "Flowcode Licensing",
      click: () => {
        BrowserWindow.getFocusedWindow().loadURL("https://www.flowcode.co.uk/buy/?"); // Flowcode Licensing URL
      }
    }
  ]
};
