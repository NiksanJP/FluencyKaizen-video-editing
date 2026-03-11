const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("studio", {
  getCompositions: () => ipcRenderer.invoke("get-compositions"),
  openComposition: (id) => ipcRenderer.invoke("open-composition", id),
  goBack: () => ipcRenderer.invoke("go-back-to-projects"),
});
