import path from "path";
import url from "url";
import fs from "fs";
import { app, Menu, ipcMain, shell, Tray, BrowserWindow, dialog } from "electron";

import appMenuTemplate from "./menu/app_menu_template";
import editMenuTemplate from "./menu/edit_menu_template";
import devMenuTemplate from "./menu/dev_menu_template";
import createWindow from "./helpers/window";
import env from "env";

// Helper function to get the correct asset path
function getAssetPath(filename) {
  const isProd = env.name === "production";
  const possiblePaths = [
    path.join(__dirname, "resources", filename),
    path.join(process.resourcesPath, "resources", filename),
    path.join(__dirname, "..", "resources", filename),
    path.join(app.getAppPath(), "resources", filename)
  ];

  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      console.log(`Found asset ${filename} at: ${possiblePath}`);
      return possiblePath;
    }
  }
  
  console.error(`Could not find asset: ${filename}`);
  return null;
}

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
  ipcMain.on('new-project', (event) => {
    dialog.showSaveDialog({
      title: 'Create New Project',
      defaultPath: app.getPath('documents'), // Default to Documents folder
      buttonLabel: 'Create Project',
      properties: ['createDirectory'],
      filters: [
        { name: 'Flowcode Project', extensions: ['fcfx'] }
      ]
    }).then(result => {
      if (!result.canceled) {
        console.log('New project path:', result.filePath);
        event.reply('project-created', result.filePath);
      }
    }).catch(err => {
      console.error(err);
    });
  });

  // Handle Open Project request
  ipcMain.on('open-project', (event) => {
    dialog.showOpenDialog({
      properties: ['openFile', 'openDirectory'],
      title: 'Open Project',
      filters: [
        { name: 'Flowcode Project', extensions: ['flowcode'] }
      ]
    }).then(result => {
      if (!result.canceled) {
        console.log('Selected paths:', result.filePaths);
        event.reply('project-opened', result.filePaths[0]);
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

  const iconPath = getAssetPath("flowcode-favicon.ico");

  try {
    // Create the main window
    const mainWindow = new BrowserWindow({
      width: 1000,
      height: 600,
      icon: iconPath || undefined,  // Fall back to default if icon not found
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

    // Create the tray icon with error handling
    if (iconPath) {
      try {
        tray = new Tray(iconPath);
        const contextMenu = Menu.buildFromTemplate([
          { label: 'Item1', type: 'radio' },
          { label: 'Item2', type: 'radio' }
        ]);
        tray.setToolTip('Flowcode Lite');
        tray.setContextMenu(contextMenu);
      } catch (error) {
        console.error('Error creating tray:', error);
      }
    }

  } catch (error) {
    console.error('Error creating window:', error);
  }
});

app.on("window-all-closed", () => {
  app.quit();
});