import path from "path";
import url from "url";
import fs from "fs";
import { app, Menu, ipcMain, shell, Tray, BrowserWindow, dialog } from "electron";

import mainMenu from "./menu/main_menu_template";
import editMenu from "./menu/edit_menu_template";
import appMenu from "./menu/app_menu_template";
import helpMenu from "./menu/help_menu_template";
import devMenu from "./menu/dev_menu_template";
import createWindow from "./helpers/window";
import env from "env";

// Global variables
let mainWindow = null;  // Main window
let tray = null;  // Tray icon

/**
 * Helper function to get the correct asset path
 * @param {string} filename - The name of the asset file
 * @returns {string|null} The path to the asset or null if not found
 */
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

/**
 * Set up the application menu
 */
const setApplicationMenu = () => {
  const menus = [mainMenu, appMenu, editMenu, helpMenu];

  if (process.env.NODE_ENV !== "production") {
    menus.push(devMenu);
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(menus));
};

/**
 * Get the file extension based on the language
 * @param {string} language - The programming language
 * @returns {string} The corresponding file extension
 */
const getFileExtension = (language) => {
  const extensions = {
    javascript: 'js',
    python: 'py',
    html: 'html',
    css: 'css',
    json: 'json',
    c: 'c',
    cpp: 'cpp',
    'c++': 'cpp',
    asm: 'asm',
    assembly: 'asm',
    verilog: 'v',
    vhdl: 'vhd',
    lua: 'lua',
    rust: 'rs',
    matlab: 'm',
    fortran: 'f90',
    flowcode: 'fcfx',
    flowcomponent: 'cmp',
    flowmacro: 'fmcr'
  };
  return extensions[language.toLowerCase()] || 'txt';
};

/**
 * Get the language based on the file extension
 * @param {string} extension - The file extension
 * @returns {string} The corresponding programming language
 */
const getLanguageFromExtension = (extension) => {
  const languages = {
    js: 'javascript',
    py: 'python',
    html: 'html',
    css: 'css',
    json: 'json',
    c: 'c',
    cpp: 'c++',
    asm: 'assembly',
    v: 'verilog',
    vhd: 'vhdl',
    lua: 'lua',
    rs: 'rust',
    m: 'matlab',
    f90: 'fortran',
    fcfx: 'flowcode',
    cmp: 'flowcomponent',
    fmcr: 'flowmacro'
  };
  return languages[extension.toLowerCase()] || 'plaintext';
};

/**
 * Initialize IPC event handlers
 */
const initIpc = () => {
  // Handler for getting app path
  ipcMain.on("need-app-path", (event) => {
    event.reply("app-path", app.getAppPath());
  });

  // Handler for opening external links
  ipcMain.on("open-external-link", (event, href) => {
    shell.openExternal(href);
  });

  // Handler for new project
  ipcMain.on('new-project', () => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow) {
      focusedWindow.loadURL(
        url.format({
          pathname: path.join(__dirname, "code-editor.html"),
          protocol: "file:",
          slashes: true
        })
      );
    }
  });

  // Handler for opening project
  ipcMain.on('open-project', (event) => {
    const mainWindow = BrowserWindow.getFocusedWindow();
    dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Flowcode Project', extensions: ['fcfx'] }
      ]
    }).then(result => {
      if (!result.canceled) {
        const selectedFile = result.filePaths[0];
        console.log("Opening project: ", selectedFile);
        event.reply('project-opened', selectedFile);
        // TODO: Add logic to open and read the project file
        // const projectData = fs.readFileSync(selectedFile);
        // You might want to send this data to the renderer process
      }
    }).catch(err => {
      console.log("Error opening project: ", err);
    });
  });

  // Handler for saving file
  ipcMain.on('save-file', (event, { code, language }) => {
    const extension = getFileExtension(language);
    dialog.showSaveDialog({
      title: 'Save File',
      defaultPath: path.join(app.getPath('documents'), `untitled.${extension}`),
      buttonLabel: 'Save',
      filters: [
        { name: 'All Files', extensions: ['*'] },
        { name: 'Flowcode Project', extensions: ['fcfx'] },
        { name: 'Flowcode Component', extensions: ['cmp'] },
        { name: 'Flowcode Macro', extensions: ['fmcr'] },
        { name: 'C', extensions: ['c'] },
        { name: 'C++', extensions: ['cpp', 'cxx', 'cc'] },
        { name: 'Assembly', extensions: ['asm', 's'] },
        { name: 'Verilog', extensions: ['v'] },
        { name: 'VHDL', extensions: ['vhd', 'vhdl'] },
        { name: 'Lua', extensions: ['lua'] },
        { name: 'Rust', extensions: ['rs'] },
        { name: 'MATLAB', extensions: ['m'] },
        { name: 'Fortran', extensions: ['f90', 'f95', 'f03'] },
        { name: 'JavaScript', extensions: ['js'] },
        { name: 'Python', extensions: ['py'] },
        { name: 'HTML', extensions: ['html', 'htm'] },
        { name: 'CSS', extensions: ['css'] },
        { name: 'JSON', extensions: ['json'] }
      ]
    }).then(result => {
      if (!result.canceled && result.filePath) {
        fs.writeFileSync(result.filePath, code);
        event.reply('file-saved', result.filePath);
        console.log(`File saved at ${result.filePath}`);
      }
    }).catch(err => {
      console.error('Error saving file:', err);
      event.reply('file-save-error', err.message);
    });
  });

  // Handler for loading file
  ipcMain.on('load-file', (event) => {
    dialog.showOpenDialog({
      title: 'Open File',
      defaultPath: app.getPath('documents'),
      buttonLabel: 'Load',
      filters: [
        { name: 'All Files', extensions: ['*'] },
        { name: 'Flowcode Project', extensions: ['fcfx'] },
        { name: 'Flowcode Component', extensions: ['cmp'] },
        { name: 'Flowcode Macro', extensions: ['fmcr'] },
        { name: 'C', extensions: ['c'] },
        { name: 'C++', extensions: ['cpp', 'cxx', 'cc'] },
        { name: 'Assembly', extensions: ['asm', 's'] },
        { name: 'Verilog', extensions: ['v'] },
        { name: 'VHDL', extensions: ['vhd', 'vhdl'] },
        { name: 'Lua', extensions: ['lua'] },
        { name: 'Rust', extensions: ['rs'] },
        { name: 'MATLAB', extensions: ['m'] },
        { name: 'Fortran', extensions: ['f90', 'f95', 'f03'] },
        { name: 'JavaScript', extensions: ['js'] },
        { name: 'Python', extensions: ['py'] },
        { name: 'HTML', extensions: ['html', 'htm'] },
        { name: 'CSS', extensions: ['css'] },
        { name: 'JSON', extensions: ['json'] }
      ],
      properties: ['openFile']
    }).then(result => {
      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        const content = fs.readFileSync(filePath, 'utf-8');
        const extension = path.extname(filePath).slice(1);
        const language = getLanguageFromExtension(extension);
        event.reply('file-loaded', { code: content, language });
        console.log(`File loaded from ${filePath}`);
      }
    }).catch(err => {
      console.error('Error loading file:', err);
      event.reply('file-load-error', err.message);
    });
  });
};

// App ready event
app.on("ready", () => {
  setApplicationMenu();
  initIpc();

  const iconPath = getAssetPath("flowcode-favicon.ico");

  try {
    mainWindow = new BrowserWindow({
      width: 1000,
      height: 600,
      icon: iconPath || undefined,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, "preload.js"),
        enableRemoteModule: env.name === "test",
        webSecurity: true
      }
    });

    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, "app.html"),
        protocol: "file:",
        slashes: true
      })
    );

    // When the main window is closed, close all other windows
    mainWindow.on("closed", () => {
      const allWindows = BrowserWindow.getAllWindows();
      allWindows.forEach(win => {
        if (win !== mainWindow) {
          win.close();
        }
      });
      
      mainWindow = null;
      app.quit();
    });

    // Create tray icon if necessary
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

// Quit when all windows are closed, except on macOS
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// On macOS, re-create a window when dock icon is clicked and no other windows are open
app.on('activate', () => {
  if (mainWindow === null) {
    const iconPath = getAssetPath("flowcode-favicon.ico");
    mainWindow = new BrowserWindow({
      width: 1000,
      height: 600,
      icon: iconPath || undefined,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, "preload.js"),
        enableRemoteModule: env.name === "test",
        webSecurity: true
      }
    });

    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, "app.html"),
        protocol: "file:",
        slashes: true
      })
    );
  }
});