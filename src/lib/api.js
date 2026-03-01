/**
 * API client that wraps window.electronAPI IPC calls.
 * Provides the same interface shape the frontend expects.
 */

const api = window.electronAPI

export const projects = {
  list: () => api.projects.list(),
  get: (id) => api.projects.get(id),
  create: (name) => api.projects.create(name),
  update: (id, updates) => api.projects.update(id, updates),
  delete: (id) => api.projects.delete(id),
}

export const assets = {
  list: (projectId) => api.assets.list(projectId),

  async upload(projectId, file) {
    const arrayBuffer = await file.arrayBuffer()
    return api.assets.upload(projectId, file.name, arrayBuffer)
  },

  delete: (projectId, fileName) => api.assets.delete(projectId, fileName),

  /** Returns the asset:// URL for use in <video>/<img> src */
  getUrl(projectId, fileName) {
    return `asset://${projectId}/${encodeURIComponent(fileName)}`
  },
}

export const captions = {
  get: (projectId, assetName) => api.captions.get(projectId, assetName),

  /**
   * Generate captions with streaming progress.
   * @param {string} projectId
   * @param {string} assetName
   * @param {(event: object) => void} onProgress - receives { type, stage, percent, message } or { type: 'complete', data }
   * @returns {Promise<object>} The final clipData
   */
  async generate(projectId, assetName, onProgress) {
    const removeListener = api.captions.onProgress(onProgress)
    try {
      const result = await api.captions.generate(projectId, assetName)
      return result
    } finally {
      removeListener()
    }
  },

  abort: () => api.captions.abort(),
}

export const pty = {
  spawn: () => api.pty.spawn(),
  input: (id, data) => api.pty.input(id, data),
  resize: (id, cols, rows) => api.pty.resize(id, cols, rows),
  kill: (id) => api.pty.kill(id),
  onOutput: (callback) => api.pty.onOutput(callback),
  onExit: (callback) => api.pty.onExit(callback),
}
