import path from "path";
import url from "url";
import { app, Menu, ipcMain, shell, Tray, BrowserWindow, dialog } from "electron";  // Added dialog for Open Project

import appMenuTemplate from "./menu/app_menu_template";
import editMenuTemplate from "./menu/edit_menu_template";
import devMenuTemplate from "./menu/dev_menu_template";
import createWindow from "./helpers/window";
import env from "env";

// Save userData in separate folders for each environment.
if (env.name !== "production") {
  const userDataPath = app.getPath("userData");
  app.setPath("userData", `${userDataPath} (${env.name})`);
}

const setApplicationMenu = () => {
  const menus = [appMenuTemplate, editMenuTemplate];
  if (env.name !== "production") {
    menus.push(devMenuTemplate);
  }
  Menu.setApplicationMenu(Menu.buildFromTemplate(menus));
};

const initIpc = () => {
  ipcMain.on("need-app-path", (event, arg) => {
    event.reply("app-path", app.getAppPath());
  });

  ipcMain.on("open-external-link", (event, href) => {
    shell.openExternal(href);
  });

  // Handle New Project request
  ipcMain.on('new-project', () => {
    // You can implement the logic for creating a new project here
    console.log('New Project clicked');
  });

  // Handle Open Project request
  ipcMain.on('open-project', (event) => {
    dialog.showOpenDialog({
      properties: ['openFile', 'openDirectory']
    }).then(result => {
      if (!result.canceled) {
        console.log('Selected paths:', result.filePaths);
        // Here, you can implement logic to open the selected project
      }
    }).catch(err => {
      console.log(err);
    });
  });
};

// This will hold the reference to the tray icon
let tray = null;

app.on("ready", () => {
  setApplicationMenu();
  initIpc();

  // Create the main window
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    icon: path.join(__dirname, "resources", "flowcode-favicon.ico"),  // Set the window icon
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: env.name === "test"
    }
  });

  // Load the main HTML file
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "app.html"),
      protocol: "file:",
      slashes: true
    })
  );

  // Create the tray icon
  tray = new Tray(path.join(__dirname, "resources", "flowcode-favicon.ico"));  // Tray icon
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Item1', type: 'radio' },
    { label: 'Item2', type: 'radio' }
  ]);
  tray.setToolTip('Flowcode Lite');
  tray.setContextMenu(contextMenu);
});

app.on("window-all-closed", () => {
  app.quit();
});
