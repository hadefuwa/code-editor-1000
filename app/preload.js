const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getArduinoCliPath: () => ipcRenderer.invoke('get-arduino-cli-path')
});

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel, data) => {
      const validChannels = [
        "need-app-path",
        "open-external-link",
        "new-project",
        "open-project",
        "save-file",
        "load-file",
        "compile-and-upload",
        "get-board-list",
        "select-port",
        "switch-to-flowcharts",
        "switch-to-code"
      ];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    on: (channel, func) => {
      const validChannels = [
        "app-path",
        "project-opened",
        "file-saved",
        "file-save-error",
        "file-loaded",
        "file-load-error",
        "project-created",
        "compile-upload-result",
        "board-list-result",
        "port-selected",
        "load-example-code"
      ];
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }

    },
    removeListener: (channel, func) => {
      const validChannels = [
        "app-path",
        "project-opened",
        "file-saved",
        "file-save-error",
        "file-loaded",
        "file-load-error",
        "project-created",
        "compile-upload-result",
        "board-list-result",
        "port-selected"
      ];
      if (validChannels.includes(channel)) {
        ipcRenderer.removeListener(channel, func);
      }
    },
    invoke: (channel, ...args) => {
      const validChannels = [
        "get-board-list",
        "get-port-list",
        "get-com-ports"  // Add this new channel
      ];
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, ...args);
      }
    }
  }
});
