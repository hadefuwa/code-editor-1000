const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel, data) => {
      const validChannels = [
        "need-app-path",
        "open-external-link",
        "new-project",
        "open-project",
        "save-file",
        "load-file"
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
        "project-created"
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
        "project-created"
      ];
      if (validChannels.includes(channel)) {
        ipcRenderer.removeListener(channel, func);
      }
    }
  }
});