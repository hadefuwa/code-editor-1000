import path from "path";
import url from "url";
import { app, Menu, ipcMain, shell, Tray, BrowserWindow, dialog } from "electron";  // Make sure to import dialog for file dialogs
import fs from "fs";  // Required for file system operations
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

// Set the application menu
const setApplicationMenu = () => {
  const menus = [appMenuTemplate, editMenuTemplate];
  if (env.name !== "production") {
    menus.push(devMenuTemplate);
  }
  Menu.setApplicationMenu(Menu.buildFromTemplate(menus));
};

// IPC communication handling
const initIpc = () => {
  ipcMain.on("need-app-path", (event, arg) => {
    event.reply("app-path", app.getAppPath());
  });

  ipcMain.on("open-external-link", (event, href) => {
    shell.openExternal(href);
  });

  // Handle New Project request
  ipcMain.on('new-project', (event) => {
    // Show dialog for creating a new project
    dialog.showSaveDialog({
      title: 'Create New Project',
      defaultPath: path.join(app.getPath('documents'), 'New Project'),
      buttonLabel: 'Create Project',
      properties: ['createDirectory', 'promptToCreate']
    }).then(result => {
      if (!result.canceled) {
        const projectPath = result.filePath;
        console.log('Creating new project at:', projectPath);

        // Create the project folder
        if (!fs.existsSync(projectPath)) {
          fs.mkdirSync(projectPath);
          console.log('Project folder created:', projectPath);

          // Optionally create a README file or initial project files
          const readmePath = path.join(projectPath, 'README.md');
          fs.writeFileSync(readmePath, '# New Project\n\nThis is your new project.', 'utf-8');
          console.log('README file created in the project folder');

          // Send confirmation back to renderer process
          event.sender.send('project-created', projectPath);
        } else {
          console.log('Project folder already exists');
        }
      }
    }).catch(err => {
      console.error('Error creating new project:', err);
    });
  });

  // Handle Open Project request
  ipcMain.on('open-project', (event) => {
    // Open dialog to select a folder or file
    dialog.showOpenDialog({
      title: 'Open Project',
      properties: ['openDirectory', 'openFile']
    }).then(result => {
      if (!result.canceled) {
        const selectedPath = result.filePaths[0];
        console.log('Selected project path:', selectedPath);

        // Send the selected path back to the renderer process
        event.sender.send('project-opened', selectedPath);
      }
    }).catch(err => {
      console.error('Error opening project:', err);
    });
  });
};

// This will hold the reference to the tray icon
let tray = null;

// Main app setup
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

// Quit the app when all windows are closed
app.on("window-all-closed", () => {
  app.quit();
});
