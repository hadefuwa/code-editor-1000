import path from "path";
import url from "url";
import fs from "fs";
import {
  app,
  Menu,
  ipcMain,
  shell,
  Tray,
  BrowserWindow,
  dialog,
} from "electron";
import { exec } from "child_process";
import { SerialPort } from "serialport";

import mainMenu from "./menu/main_menu_template";
import editMenu from "./menu/edit_menu_template";
import appMenu from "./menu/app_menu_template";
import helpMenu from "./menu/help_menu_template";
import devMenu from "./menu/dev_menu_template";
import createWindow from "./helpers/window";
import env from "env";

/******************** Arduino Compiler *************************/

// Update the path to arduino-cli.exe
const arduinoCliPath = app.isPackaged
  ? path.join(
      process.resourcesPath,
      "microcontroller_compilers",
      "Arduino",
      "arduino-cli.exe"
    )
  : path.join(
      app.getAppPath(),
      "resources",
      "microcontroller_compilers",
      "Arduino",
      "arduino-cli.exe"
    );
//console.log('Arduino CLI path:', arduinoCliPath);

// Use this function when your app starts
/*
checkArduinoCliAvailability()
  .then(version => console.log(`Arduino CLI version: ${version}`))
  .catch(error => console.error(error));
*/

// Global variables
let mainWindow = null; // Main window
let tray = null; // Tray icon

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
    path.join(app.getAppPath(), "resources", filename),
  ];

  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      //console.log(`Found asset ${filename} at: ${possiblePath}`);
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
    javascript: "js",
    python: "py",
    html: "html",
    css: "css",
    json: "json",
    c: "c",
    cpp: "cpp",
    "c++": "cpp",
    asm: "asm",
    assembly: "asm",
    verilog: "v",
    vhdl: "vhd",
    matlab: "m",
    fortran: "f90",
    flowcode: "fcfx",
    flowcomponent: "cmp",
    flowmacro: "fmcr",
  };
  return extensions[language.toLowerCase()] || "txt";
};

/**
 * Get the language based on the file extension
 * @param {string} extension - The file extension
 * @returns {string} The corresponding programming language
 */
const getLanguageFromExtension = (extension) => {
  const languages = {
    js: "javascript",
    py: "python",
    html: "html",
    css: "css",
    json: "json",
    c: "c",
    cpp: "c++",
    asm: "assembly",
    v: "verilog",
    vhd: "vhdl",
    m: "matlab",
    f90: "fortran",
    fcfx: "flowcode",
    cmp: "flowcomponent",
    fmcr: "flowmacro",
  };
  return languages[extension.toLowerCase()] || "plaintext";
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
  ipcMain.on("new-project", () => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow) {
      focusedWindow.loadURL(
        url.format({
          pathname: path.join(__dirname, "code-editor.html"),
          protocol: "file:",
          slashes: true,
        })
      );
    }
  });

  // Handler for opening project
  ipcMain.on("open-project", (event) => {
    const mainWindow = BrowserWindow.getFocusedWindow();
    dialog
      .showOpenDialog(mainWindow, {
        properties: ["openFile"],
        filters: [{ name: "Flowcode Project", extensions: ["fcfx"] }],
      })
      .then((result) => {
        if (!result.canceled) {
          const selectedFile = result.filePaths[0];
          console.log("Opening project: ", selectedFile);
          event.reply("project-opened", selectedFile);
          // TODO: Add logic to open and read the project file
          // const projectData = fs.readFileSync(selectedFile);
          // You might want to send this data to the renderer process
        }
      })
      .catch((err) => {
        console.log("Error opening project: ", err);
      });
  });

  // Handler for saving file
  ipcMain.on("save-file", (event, { code, language }) => {
    const extension = getFileExtension(language);
    dialog
      .showSaveDialog({
        title: "Save File",
        defaultPath: path.join(
          app.getPath("documents"),
          `untitled.${extension}`
        ),
        buttonLabel: "Save",
        filters: [
          { name: "All Files", extensions: ["*"] },
          { name: "Flowcode Project", extensions: ["fcfx"] },
          { name: "Flowcode Component", extensions: ["cmp"] },
          { name: "Flowcode Macro", extensions: ["fmcr"] },
          { name: "C", extensions: ["c"] },
          { name: "C++", extensions: ["cpp", "cxx", "cc"] },
          { name: "Assembly", extensions: ["asm", "s"] },
          { name: "Verilog", extensions: ["v"] },
          { name: "VHDL", extensions: ["vhd", "vhdl"] },
          { name: "MATLAB", extensions: ["m"] },
          { name: "Fortran", extensions: ["f90", "f95", "f03"] },
          { name: "JavaScript", extensions: ["js"] },
          { name: "Python", extensions: ["py"] },
          { name: "HTML", extensions: ["html", "htm"] },
          { name: "CSS", extensions: ["css"] },
          { name: "JSON", extensions: ["json"] },
        ],
      })
      .then((result) => {
        if (!result.canceled && result.filePath) {
          fs.writeFileSync(result.filePath, code);
          event.reply("file-saved", result.filePath);
          console.log(`File saved at ${result.filePath}`);
        }
      })
      .catch((err) => {
        console.error("Error saving file:", err);
        event.reply("file-save-error", err.message);
      });
  });

  // Handler for loading file
  ipcMain.on("load-file", (event) => {
    dialog
      .showOpenDialog({
        title: "Open File",
        defaultPath: app.getPath("documents"),
        buttonLabel: "Load",
        filters: [
          { name: "All Files", extensions: ["*"] },
          { name: "Flowcode Project", extensions: ["fcfx"] },
          { name: "Flowcode Component", extensions: ["cmp"] },
          { name: "Flowcode Macro", extensions: ["fmcr"] },
          { name: "C", extensions: ["c"] },
          { name: "C++", extensions: ["cpp", "cxx", "cc"] },
          { name: "Assembly", extensions: ["asm", "s"] },
          { name: "Verilog", extensions: ["v"] },
          { name: "VHDL", extensions: ["vhd", "vhdl"] },
          { name: "MATLAB", extensions: ["m"] },
          { name: "Fortran", extensions: ["f90", "f95", "f03"] },
          { name: "JavaScript", extensions: ["js"] },
          { name: "Python", extensions: ["py"] },
          { name: "HTML", extensions: ["html", "htm"] },
          { name: "CSS", extensions: ["css"] },
          { name: "JSON", extensions: ["json"] },
        ],
        properties: ["openFile"],
      })
      .then((result) => {
        if (!result.canceled && result.filePaths.length > 0) {
          const filePath = result.filePaths[0];
          const content = fs.readFileSync(filePath, "utf-8");
          const extension = path.extname(filePath).slice(1);
          const language = getLanguageFromExtension(extension);
          event.reply("file-loaded", { code: content, language });
          console.log(`File loaded from ${filePath}`);
        }
      })
      .catch((err) => {
        console.error("Error loading file:", err);
        event.reply("file-load-error", err.message);
      });
  });

  // New IPC handler for compiling and uploading to microcontroller
  ipcMain.on(
    "compile-and-upload",
    async (event, { code, boardType, comPort }) => {
      try {
        const tempDir = path.join(app.getPath("temp"), "flowcode-lite");
        const sketchName = "flowcode-lite";
        const tempSketchPath = path.join(tempDir, `${sketchName}.ino`);

        console.log("Temp directory:", tempDir);
        console.log("Temp sketch path:", tempSketchPath);

        // Ensure the temp directory exists
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        // Write the sketch file
        fs.writeFileSync(tempSketchPath, code, "utf8");
        console.log(`Temporary sketch saved at: ${tempSketchPath}`);

        // Construct the command
        const compileCommand = `"${arduinoCliPath}" compile --fqbn ${boardType} "${tempDir}"`;
        const uploadCommand = `"${arduinoCliPath}" upload -p ${comPort} --fqbn ${boardType} "${tempDir}"`;
        const fullCommand = `${compileCommand} && ${uploadCommand}`;

        console.log("Executing command:", fullCommand);

        // Execute the command
        exec(fullCommand, (error, stdout, stderr) => {
          if (error) {
            console.error(`exec error: ${error}`);
            console.error(`stderr: ${stderr}`);
            event.reply("compile-upload-result", {
              success: false,
              error: error.toString() + "\n" + stderr,
            });
            return;
          }
          console.log(`stdout: ${stdout}`);
          console.error(`stderr: ${stderr}`);
          event.reply("compile-upload-result", {
            success: true,
            message: "Code compiled and uploaded successfully",
          });
        });
      } catch (error) {
        console.error("Compile and upload error:", error);
        event.reply("compile-upload-result", {
          success: false,
          error: error.toString(),
        });
      }
    }
  );

  // Handler for getting COM ports
  ipcMain.handle("get-com-ports", async () => {
    try {
      const ports = await SerialPort.list();
      console.log("Available COM ports:", ports);
      return ports.map((port) => ({
        path: port.path,
        friendlyName: port.friendlyName || port.path,
      }));
    } catch (error) {
      console.error("Error getting COM ports:", error);
      return [];
    }
  });

  ipcMain.on("switch-to-flowcharts", () => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow) {
      focusedWindow.loadURL(
        url.format({
          pathname: path.join(__dirname, "flowcharts.html"),
          protocol: "file:",
          slashes: true,
        })
      );
    }
  });

  ipcMain.on("switch-to-code", () => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow) {
      focusedWindow.loadURL(
        url.format({
          pathname: path.join(__dirname, "code-editor.html"),
          protocol: "file:",
          slashes: true,
        })
      );
    }
  });

  ipcMain.on("switch-to-scada", () => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow) {
      focusedWindow.loadURL(
        url.format({
          pathname: path.join(__dirname, "industrialMonitor.html"),
          protocol: "file:",
          slashes: true,
        })
      );
    }
  });

  ipcMain.on("switch-to-dashboard", () => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow) {
      focusedWindow.loadURL(url.format({ pathname: path.join(__dirname, "dashboard.html"), protocol: "file:", slashes: true }));
    }
  });
};

// Helper function to get the compile command based on language and board type
function getCompileCommand(language, filePath, boardType) {
  switch (language) {
    case "c":
    case "cpp":
      return `avr-gcc -mmcu=${boardType} -o ${filePath}.hex ${filePath}`;
    case "arduino":
      return `arduino-cli compile --fqbn ${boardType} ${filePath}`;
    // Add more cases for other languages/boards as needed
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
}

function getUploadCommand(boardType, filePath, comPort) {
  switch (boardType) {
    case "atmega328p":
      return `avrdude -p ${boardType} -c arduino -P ${comPort} -U flash:w:${filePath}.hex`;
    case "arduino:avr:uno":
      return `arduino-cli upload -p ${comPort} --fqbn ${boardType} ${filePath}`;
    // Add more cases for other boards as needed
    default:
      throw new Error(`Unsupported board type: ${boardType}`);
  }
}

function compileAndUpload(sketch, board, port) {
  return new Promise((resolve, reject) => {
    const command = `"${arduinoCliPath}" compile --fqbn ${board} "${sketch}" && "${arduinoCliPath}" upload -p ${port} --fqbn ${board} "${sketch}"`;
    console.log(`Executing command: ${command}`);

    exec(command, (error, stdout, stderr) => {
      console.log(`stdout: ${stdout}`);
      console.log(`stderr: ${stderr}`);

      if (error) {
        console.error(`exec error: ${error}`);
        reject(`Error: ${error.message}`);
      } else {
        resolve(`Command executed successfully`);
      }
    });
  });
}

// A function to check if Arduino CLI is available
function checkArduinoCliAvailability() {
  return new Promise((resolve, reject) => {
    exec(`"${arduinoCliPath}" version`, (error, stdout, stderr) => {
      if (error) {
        reject(`Arduino CLI not found or not working: ${error.message}`);
        return;
      }
      resolve(stdout.trim());
    });
  });
}

//I want to load the example code from the resources folder when the code editor is loaded
function loadExampleCode() {
  const examplePath = path.join(
    app.getAppPath(),
    "resources",
    "examples",
    "arduino",
    "arduino-blink.cpp"
  );
  console.log("Attempting to load example from:", examplePath);
  try {
    const exampleCode = fs.readFileSync(examplePath, "utf8");
    console.log("Example code loaded successfully");
    return exampleCode;
  } catch (error) {
    console.error("Error reading example file:", error);
    return "// Error loading example code";
  }
}

// *********** Code for when the App is ready ***********
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
        webSecurity: true, // Disable web security for development
      },
    });

    //Content Security Policy (CSP) is a security measure that helps protect your Electron application from various types of attacks
    mainWindow.webContents.session.webRequest.onHeadersReceived(
      (details, callback) => {
        callback({
          responseHeaders: {
            ...details.responseHeaders,
            "Content-Security-Policy": [
              "default-src * data: blob: 'unsafe-eval' 'unsafe-inline'",
            ],
          },
        });
      }
    );

    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, "app.html"),
        protocol: "file:",
        slashes: true,
      })
    );

    // send the example code to the renderer process
    mainWindow.webContents.on("did-finish-load", () => {
      const exampleCode = loadExampleCode();
      mainWindow.webContents.send("load-example-code", exampleCode);
    });

    // When the main window is closed, close all other windows
    mainWindow.on("closed", () => {
      const allWindows = BrowserWindow.getAllWindows();
      allWindows.forEach((win) => {
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
          { label: "Item1", type: "radio" },
          { label: "Item2", type: "radio" },
        ]);
        tray.setToolTip("Flowcode Lite");
        tray.setContextMenu(contextMenu);
      } catch (error) {
        console.error("Error creating tray:", error);
      }
    }
  } catch (error) {
    console.error("Error creating window:", error);
  }
});

// Quit when all windows are closed, except on macOS
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// On macOS, re-create a window when dock icon is clicked and no other windows are open
app.on("activate", () => {
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
        webSecurity: false, //set to true for production to enable web security
        allowRunningInsecureContent: true, // Allow insecure content for development
      },
    });

    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, "app.html"),
        protocol: "file:",
        slashes: true,
      })
    );
  }
});

/*
console.log('Current working directory:', process.cwd());
console.log('App path:', app.getAppPath());
console.log('User data path:', app.getPath('userData'));
*/
