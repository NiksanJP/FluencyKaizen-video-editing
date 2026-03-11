const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("studio", {
  getCompositions: () => ipcRenderer.invoke("get-compositions"),
  openComposition: (id) => ipcRenderer.invoke("open-composition", id),
  goBack: () => ipcRenderer.invoke("go-back-to-projects"),
  importVideo: () => ipcRenderer.invoke("import-video"),
  onPipelineProgress: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on("pipeline-progress", handler);
    return () => ipcRenderer.removeListener("pipeline-progress", handler);
  },
});
