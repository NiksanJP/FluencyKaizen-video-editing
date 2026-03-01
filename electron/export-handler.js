import { ipcMain, dialog, app } from 'electron'
import path from 'path'
import http from 'http'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { PROJECTS_DIR } from './ipc-handlers.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')

let cachedBundlePath = null

const MIME_TYPES = {
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
}

/**
 * Start a temporary HTTP server that serves files from the projects directory.
 * Returns { server, port, close }.
 */
function startAssetServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      // URL format: /projects/<projectId>/assets/<fileName>
      const decodedPath = decodeURIComponent(req.url)
      const filePath = path.join(PROJECTS_DIR, '..', decodedPath.replace(/^\//, ''))

      // Security: ensure resolved path is under PROJECTS_DIR
      const resolved = path.resolve(filePath)
      if (!resolved.startsWith(path.resolve(PROJECTS_DIR))) {
        res.writeHead(403)
        res.end('Forbidden')
        return
      }

      if (!fs.existsSync(resolved)) {
        res.writeHead(404)
        res.end('Not found')
        return
      }

      const stat = fs.statSync(resolved)
      const ext = path.extname(resolved).toLowerCase()
      const contentType = MIME_TYPES[ext] || 'application/octet-stream'

      // Handle range requests for video seeking
      const range = req.headers.range
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-')
        const start = parseInt(parts[0], 10)
        const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': end - start + 1,
          'Content-Type': contentType,
        })
        fs.createReadStream(resolved, { start, end }).pipe(res)
      } else {
        res.writeHead(200, {
          'Content-Length': stat.size,
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes',
        })
        fs.createReadStream(resolved).pipe(res)
      }
    })

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port
      console.log(`[export] Asset server started on http://127.0.0.1:${port}`)
      resolve({
        server,
        port,
        close: () => new Promise((r) => server.close(r)),
      })
    })

    server.on('error', reject)
  })
}

/**
 * Resolve asset://, file://, and bare filesystem paths in track data
 * to http://127.0.0.1 URLs served by the temporary asset server.
 */
function resolveAssetUrls(tracks, serverPort) {
  const projectsResolved = path.resolve(PROJECTS_DIR)

  return tracks.map((track) => ({
    ...track,
    clips: (track.clips || []).map((clip) => {
      const resolved = { ...clip }
      for (const key of ['src', 'path']) {
        const val = resolved[key]
        if (typeof val !== 'string') continue

        // Already an HTTP URL — nothing to do
        if (val.startsWith('http://') || val.startsWith('https://')) continue

        if (val.startsWith('asset://')) {
          const url = new URL(val)
          const projectId = url.hostname
          const fileName = url.pathname.slice(1)
          resolved[key] = `http://127.0.0.1:${serverPort}/projects/${projectId}/assets/${fileName}`
          console.log(`[export] Resolved asset:// URL: ${val} → ${resolved[key]}`)
        } else if (val.startsWith('file://')) {
          const fsPath = fileURLToPath(val)
          const relative = path.relative(projectsResolved, fsPath)
          if (!relative.startsWith('..')) {
            resolved[key] = `http://127.0.0.1:${serverPort}/projects/${relative}`
            console.log(`[export] Resolved file:// URL: ${val} → ${resolved[key]}`)
          } else {
            console.warn(`[export] file:// URL outside projects dir, cannot serve: ${val}`)
          }
        } else if (path.isAbsolute(val)) {
          const relative = path.relative(projectsResolved, val)
          if (!relative.startsWith('..')) {
            resolved[key] = `http://127.0.0.1:${serverPort}/projects/${relative}`
            console.log(`[export] Resolved absolute path: ${val} → ${resolved[key]}`)
          } else {
            console.warn(`[export] Absolute path outside projects dir, cannot serve: ${val}`)
          }
        }
      }
      return resolved
    }),
  }))
}

export function registerExportHandlers() {
  ipcMain.handle('export:render', async (event, options) => {
    const sender = event.sender
    const { tracks, width, height, fps, durationInFrames } = options

    const sendProgress = (data) => {
      if (!sender.isDestroyed()) {
        sender.send('export:progress', data)
      }
    }

    // Show save dialog
    const { canceled, filePath: outputPath } = await dialog.showSaveDialog({
      title: 'Export MP4',
      defaultPath: path.join(app.getPath('videos') || app.getPath('home'), 'export.mp4'),
      filters: [{ name: 'MP4 Video', extensions: ['mp4'] }],
    })

    if (canceled || !outputPath) {
      return { canceled: true }
    }

    let assetServer = null

    try {
      // Dynamic import — these are Node-only packages
      const { bundle } = await import('@remotion/bundler')
      const { renderMedia, selectComposition } = await import('@remotion/renderer')

      // Start temporary HTTP server to serve asset files
      assetServer = await startAssetServer()

      // Stage 1: Bundle (cached after first call)
      sendProgress({ stage: 'bundling', percent: 5, message: 'Bundling composition...' })

      if (!cachedBundlePath) {
        const entryPoint = path.join(rootDir, 'src', 'remotion', 'RenderEntry.jsx')
        cachedBundlePath = await bundle({
          entryPoint,
          webpackOverride: (config) => ({
            ...config,
            resolve: {
              ...config.resolve,
              alias: {
                ...(config.resolve?.alias || {}),
                '@': path.join(rootDir, 'src'),
              },
            },
          }),
        })
      }

      sendProgress({ stage: 'bundling', percent: 15, message: 'Bundle ready' })

      // Stage 2: Select composition and render
      sendProgress({ stage: 'rendering', percent: 20, message: 'Preparing render...' })

      const resolvedTracks = resolveAssetUrls(tracks, assetServer.port)

      // Warn about any clips that still have non-HTTP media URLs
      for (const track of resolvedTracks) {
        for (const clip of track.clips || []) {
          for (const key of ['src', 'path']) {
            const val = clip[key]
            if (typeof val === 'string' && val && !val.startsWith('http://') && !val.startsWith('https://')) {
              console.warn(`[export] Warning: clip "${clip.name || clip.id}" still has non-HTTP ${key}: ${val}`)
            }
          }
        }
      }

      const composition = await selectComposition({
        serveUrl: cachedBundlePath,
        id: 'EditorComposition',
        inputProps: {
          tracks: resolvedTracks,
          fallbackTitle: 'FluencyKaizen',
          playerTotalFrames: durationInFrames,
          isPlaying: false,
        },
      })

      // Override composition settings with editor values
      composition.width = width
      composition.height = height
      composition.fps = fps
      composition.durationInFrames = durationInFrames

      await renderMedia({
        composition,
        serveUrl: cachedBundlePath,
        codec: 'h264',
        outputLocation: outputPath,
        inputProps: {
          tracks: resolvedTracks,
          fallbackTitle: 'FluencyKaizen',
          playerTotalFrames: durationInFrames,
          isPlaying: false,
        },
        onProgress: ({ progress }) => {
          const percent = Math.round(20 + progress * 80)
          sendProgress({
            stage: 'rendering',
            percent,
            message: `Rendering: ${Math.round(progress * 100)}%`,
          })
        },
      })

      sendProgress({ stage: 'complete', percent: 100, message: 'Export complete' })
      return { success: true, outputPath }
    } catch (error) {
      console.error('Export error:', error)
      sendProgress({ stage: 'error', percent: 0, message: error.message })
      throw error
    } finally {
      if (assetServer) {
        await assetServer.close()
      }
    }
  })
}
