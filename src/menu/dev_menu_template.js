import { BrowserWindow } from "electron";

export default {
  label: "Help",
  submenu: [
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
