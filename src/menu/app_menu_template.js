import { BrowserWindow } from "electron";
import path from "path";
import url from "url";

export default {
  label: "Program",
  submenu: [
    {
      label: "Open Code Editor",
      click: () => {
        const codeEditorWindow = new BrowserWindow({
          width: 1200,
          height: 800,
          webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
          }
        });
    
        codeEditorWindow.loadURL(path.join(__dirname, 'code-editor.html'));
      }
    },
    {
      label: "Compile To Target",
      accelerator: "CmdOrCtrl+H",
      enabled: false, // This disables the menu item (greyed out)
      click: () => {
        const mainWindow = BrowserWindow.getFocusedWindow(); // Get the current window
        mainWindow.loadURL(
          url.format({
            pathname: path.join(__dirname, "app.html"), // Ensure the correct path to app.html
            protocol: "file:",
            slashes: true
          })
        );
      }
    },
  ]
};
