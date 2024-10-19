import { BrowserWindow, dialog } from "electron";
import path from "path";
import url from "url";
import fs from "fs";

export default {
  label: "File",
  submenu: [

    /*
    // New Project
    {
      label: "New Project",
      accelerator: "CmdOrCtrl+N", // Keyboard shortcut for "Save As"
      click: () => {
        const mainWindow = BrowserWindow.getFocusedWindow();
        dialog.showSaveDialog(mainWindow, {
          title: 'New Project',
          defaultPath: path.join(__dirname, 'new-project.fcfx'), // Set a default path
          filters: [
            { name: 'Flowcode Project', extensions: ['fcfx'] } // Specify file extension
          ]
        }).then(result => {
          if (!result.canceled) {
            const savePath = result.filePath;
            console.log("Saving project as: ", savePath);
            // Add logic to save project data
            // fs.writeFileSync(savePath, projectData);
          }
        }).catch(err => {
          console.log("Error saving project as: ", err);
        });
      }
    },
    */
    {
      label: "New Project",
      accelerator: "CmdOrCtrl+N",
      click: () => {
        const focusedWindow = BrowserWindow.getFocusedWindow();
        if (focusedWindow) {
          // Load the code-editor.html page in the main window
          focusedWindow.loadURL(
            path.join("file://", __dirname, "code-editor.html")
          );
        }
      }
    },

    // Open Project
    {
      label: "Open Project",
      accelerator: "CmdOrCtrl+O", // Keyboard shortcut
      click: () => {
        const mainWindow = BrowserWindow.getFocusedWindow();
        dialog.showOpenDialog(mainWindow, {
          properties: ['openFile'],
          filters: [
            { name: 'Flowcode Project', extensions: ['fcfx'] } // Specify your file extension
          ]
        }).then(result => {
          if (!result.canceled) {
            const selectedFile = result.filePaths[0];
            // Add logic to open and read the project file
            console.log("Opening project: ", selectedFile);
            // Load project content (you might load the file contents here)
            // fs.readFileSync(selectedFile);
          }
        }).catch(err => {
          console.log("Error opening project: ", err);
        });
      }
    },

    // Save Project
    {
      label: "Save Project",
      accelerator: "CmdOrCtrl+S", // Keyboard shortcut
      click: () => {
        const mainWindow = BrowserWindow.getFocusedWindow();
        // Assuming you already know the project path and want to save it
        // You can use `fs.writeFileSync()` to save the project content
        console.log("Saving current project...");
        // Add saving logic here, e.g., fs.writeFileSync(projectPath, projectData);
      }
    },

    // Save As
    {
      label: "Save As",
      accelerator: "CmdOrCtrl+Shift+S", // Keyboard shortcut for "Save As"
      click: () => {
        const mainWindow = BrowserWindow.getFocusedWindow();
        dialog.showSaveDialog(mainWindow, {
          title: 'Save Project As',
          defaultPath: path.join(__dirname, 'new-project.fcfx'), // Set a default path
          filters: [
            { name: 'Flowcode Project', extensions: ['fcfx'] } // Specify file extension
          ]
        }).then(result => {
          if (!result.canceled) {
            const savePath = result.filePath;
            console.log("Saving project as: ", savePath);
            // Add logic to save project data
            // fs.writeFileSync(savePath, projectData);
          }
        }).catch(err => {
          console.log("Error saving project as: ", err);
        });
      }
    },

    // Exit Application
    {
      label: "Exit",
      role: process.platform === "darwin" ? "close" : "quit", // Native behavior based on platform
      accelerator: "CmdOrCtrl+Q", // Keyboard shortcut
      click: () => {
        const mainWindow = BrowserWindow.getFocusedWindow();
        mainWindow.close(); // Close the current window (or quit the app)
      }
    }
  ]
};
