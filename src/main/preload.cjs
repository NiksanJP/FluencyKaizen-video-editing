const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("studio", {
  isElectron: true,
  importVideo: (lang) => ipcRenderer.invoke("import-video", lang),
  goBack: () => ipcRenderer.invoke("go-back-to-projects"),
});
