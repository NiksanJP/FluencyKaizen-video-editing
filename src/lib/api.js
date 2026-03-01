/**
 * API client that wraps window.electronAPI IPC calls.
 * Provides the same interface shape the frontend expects.
 * Falls back to no-ops when running outside Electron (e.g. Vite-only dev).
 */

const api = window.electronAPI
const isElectron = !!api

const noop = () => {}
const noopAsync = () => Promise.resolve()
const noopRemoveListener = () => noop

export const projects = {
  list: () => isElectron ? api.projects.list() : Promise.resolve([]),
  get: (id) => isElectron ? api.projects.get(id) : Promise.resolve(null),
  create: (name) => isElectron ? api.projects.create(name) : Promise.resolve(null),
  update: (id, updates) => isElectron ? api.projects.update(id, updates) : Promise.resolve(),
  delete: (id) => isElectron ? api.projects.delete(id) : Promise.resolve(),
}

export const assets = {
  list: (projectId) => isElectron ? api.assets.list(projectId) : Promise.resolve([]),

  async upload(projectId, file) {
    if (!isElectron) return null
    const arrayBuffer = await file.arrayBuffer()
    return api.assets.upload(projectId, file.name, arrayBuffer)
  },

  delete: (projectId, fileName) => isElectron ? api.assets.delete(projectId, fileName) : Promise.resolve(),

  /** Returns a playable URL for the asset — HTTP in dev, asset:// in Electron prod */
  getUrl(projectId, fileName) {
    if (typeof window !== 'undefined' && window.location.protocol === 'http:') {
      return `/project-assets/${projectId}/${encodeURIComponent(fileName)}`
    }
    return `asset://${projectId}/${encodeURIComponent(fileName)}`
  },
}

export const captions = {
  get: (projectId, assetName) => isElectron ? api.captions.get(projectId, assetName) : Promise.resolve(null),

  /**
   * Generate captions with streaming progress.
   * @param {string} projectId
   * @param {string} assetName
   * @param {(event: object) => void} onProgress - receives { type, stage, percent, message } or { type: 'complete', data }
   * @returns {Promise<object>} The final clipData
   */
  async generate(projectId, assetName, onProgress) {
    if (!isElectron) return null
    const removeListener = api.captions.onProgress(onProgress)
    try {
      const result = await api.captions.generate(projectId, assetName)
      return result
    } finally {
      removeListener()
    }
  },

  abort: () => isElectron ? api.captions.abort() : undefined,
}

export const exportVideo = {
  /**
   * Render the timeline to MP4.
   * @param {object} options - { tracks, width, height, fps, durationInFrames }
   * @param {(event: object) => void} onProgress - receives { stage, percent, message }
   * @returns {Promise<{ success: boolean, outputPath: string } | { canceled: true }>}
   */
  async render(options, onProgress) {
    if (!isElectron) return { canceled: true }
    const removeListener = api.export.onProgress(onProgress)
    try {
      return await api.export.render(options)
    } finally {
      removeListener()
    }
  },
}

export const watch = {
  project: (projectId) => isElectron ? api.watch.project(projectId) : Promise.resolve(),
  stop: (projectId) => isElectron ? api.watch.stop(projectId) : undefined,
  onExternalChange: (callback) => isElectron ? api.watch.onExternalChange(callback) : noop,
}

export const pty = {
  spawn: (options) => isElectron ? api.pty.spawn(options) : Promise.resolve(null),
  input: (id, data) => isElectron ? api.pty.input(id, data) : undefined,
  resize: (id, cols, rows) => isElectron ? api.pty.resize(id, cols, rows) : undefined,
  kill: (id) => isElectron ? api.pty.kill(id) : undefined,
  onOutput: (callback) => isElectron ? api.pty.onOutput(callback) : noop,
  onExit: (callback) => isElectron ? api.pty.onExit(callback) : noop,
}
