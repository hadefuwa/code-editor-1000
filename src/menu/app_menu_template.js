import { BrowserWindow } from "electron";
import path from "path";
import url from "url";

export default {
  label: "Download",
  submenu: [
    {
      label: "Compile To Target",
      accelerator: "CmdOrCtrl+H",
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
    }
  ]
};
