import { BrowserWindow } from "electron";
import path from "path";

let aboutWindow = null;
let wikiWindow = null;
let forumsWindow = null;
let licensingWindow = null;

export default {
  label: "Help",
  submenu: [
    // About Lite
    {
      label: "About Lite",
      click: () => {
        if (aboutWindow !== null) {
          aboutWindow.focus();
          return;
        }

        aboutWindow = new BrowserWindow({
          width: 400,
          height: 300,
          title: "About Flowcode Lite",
          webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
          },
          resizable: false,
          minimizable: false,
          maximizable: false
        });

        aboutWindow.setMenuBarVisibility(false);
        aboutWindow.loadFile("app/about-lite.html");

        aboutWindow.on('closed', () => {
          aboutWindow = null;
        });
      }
    },
    // Flowcode Wiki
    {
      label: "Flowcode Wiki",
      click: () => {
        if (wikiWindow !== null) {
          wikiWindow.focus();
          return;
        }

        wikiWindow = new BrowserWindow({
          width: 800,
          height: 600,
          title: "Flowcode Wiki",
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
          }
        });

        wikiWindow.setMenuBarVisibility(false);
        wikiWindow.loadURL("https://www.flowcode.co.uk/wiki");

        wikiWindow.on('closed', () => {
          wikiWindow = null;
        });
      }
    },
    // Flowcode Forums
    {
      label: "Flowcode Forums",
      click: () => {
        if (forumsWindow !== null) {
          forumsWindow.focus();
          return;
        }

        forumsWindow = new BrowserWindow({
          width: 800,
          height: 600,
          title: "Flowcode Forums",
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
          }
        });

        forumsWindow.setMenuBarVisibility(false);
        forumsWindow.loadURL("https://www.flowcode.co.uk/forums");

        forumsWindow.on('closed', () => {
          forumsWindow = null;
        });
      }
    },
    // Flowcode Licensing
    {
      label: "Flowcode Licensing",
      click: () => {
        if (licensingWindow !== null) {
          licensingWindow.focus();
          return;
        }

        licensingWindow = new BrowserWindow({
          width: 800,
          height: 600,
          title: "Flowcode Licensing",
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
          }
        });

        licensingWindow.setMenuBarVisibility(false);
        licensingWindow.loadURL("https://www.flowcode.co.uk/buy");

        licensingWindow.on('closed', () => {
          licensingWindow = null;
        });
      }
    }
  ]
};
