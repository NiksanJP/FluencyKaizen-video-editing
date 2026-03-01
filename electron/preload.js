const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,

  // Projects
  projects: {
    list: () => ipcRenderer.invoke('projects:list'),
    get: (id) => ipcRenderer.invoke('projects:get', id),
    create: (name) => ipcRenderer.invoke('projects:create', name),
    update: (id, updates) => ipcRenderer.invoke('projects:update', id, updates),
    delete: (id) => ipcRenderer.invoke('projects:delete', id),
  },

  // Assets
  assets: {
    list: (projectId) => ipcRenderer.invoke('assets:list', projectId),
    upload: (projectId, fileName, arrayBuffer) =>
      ipcRenderer.invoke('assets:upload', projectId, fileName, arrayBuffer),
    delete: (projectId, fileName) =>
      ipcRenderer.invoke('assets:delete', projectId, fileName),
  },

  // Captions
  captions: {
    get: (projectId, assetName) =>
      ipcRenderer.invoke('captions:get', projectId, assetName),
    generate: (projectId, assetName) =>
      ipcRenderer.invoke('captions:generate', projectId, assetName),
    abort: () => ipcRenderer.send('captions:abort'),
    onProgress: (callback) => {
      const handler = (_event, data) => callback(data)
      ipcRenderer.on('captions:progress', handler)
      return () => ipcRenderer.removeListener('captions:progress', handler)
    },
  },

  // Export
  export: {
    render: (options) => ipcRenderer.invoke('export:render', options),
    onProgress: (callback) => {
      const handler = (_event, data) => callback(data)
      ipcRenderer.on('export:progress', handler)
      return () => ipcRenderer.removeListener('export:progress', handler)
    },
  },

  // File Watcher
  watch: {
    project: (projectId) => ipcRenderer.invoke('watch:project', projectId),
    stop: (projectId) => ipcRenderer.send('watch:stop', projectId),
    onExternalChange: (callback) => {
      const handler = (_event, projectId) => callback(projectId)
      ipcRenderer.on('project:external-change', handler)
      return () => ipcRenderer.removeListener('project:external-change', handler)
    },
  },

  // PTY (Terminal)
  pty: {
    spawn: (options) => ipcRenderer.invoke('pty:spawn', options),
    input: (id, data) => ipcRenderer.send('pty:input', id, data),
    resize: (id, cols, rows) => ipcRenderer.send('pty:resize', id, cols, rows),
    kill: (id) => ipcRenderer.send('pty:kill', id),
    onOutput: (callback) => {
      const handler = (_event, id, data) => callback(id, data)
      ipcRenderer.on('pty:output', handler)
      return () => ipcRenderer.removeListener('pty:output', handler)
    },
    onExit: (callback) => {
      const handler = (_event, id, exitCode) => callback(id, exitCode)
      ipcRenderer.on('pty:exit', handler)
      return () => ipcRenderer.removeListener('pty:exit', handler)
    },
  },
})
