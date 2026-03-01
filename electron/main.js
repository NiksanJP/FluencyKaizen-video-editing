import { app, BrowserWindow, protocol, session } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import dotenv from 'dotenv'
import { registerAllHandlers, PROJECTS_DIR } from './ipc-handlers.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')

// Load .env from project root
dotenv.config({ path: path.join(rootDir, '.env') })

let mainWindow

// Register custom protocol for serving asset files directly from disk
// URLs look like: asset://projectId/filename.mp4
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'asset',
    privileges: {
      stream: true,
      supportFetchAPI: true,
      bypassCSP: true,
      corsEnabled: true,
    },
  },
])

function createWindow() {
  // Register IPC handlers
  registerAllHandlers()

  // Set permissive CSP for dev mode to suppress Electron warning
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' asset: blob: data: http://localhost:* https://fonts.googleapis.com https://fonts.gstatic.com; " +
          "media-src 'self' asset: blob: data: http://localhost:*; " +
          "img-src 'self' asset: blob: data: http://localhost:* https:; " +
          "font-src 'self' data: https://fonts.gstatic.com; " +
          "connect-src 'self' ws://localhost:* http://localhost:* https:;"
        ],
      },
    })
  })

  // MIME type map for asset files
  const MIME_TYPES = {
    '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm',
    '.avi': 'video/x-msvideo', '.mkv': 'video/x-matroska',
    '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg',
    '.aac': 'audio/aac', '.flac': 'audio/flac',
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
    '.bmp': 'image/bmp',
  }

  // Handle asset:// protocol requests with range support
  protocol.handle('asset', (request) => {
    const url = new URL(request.url)
    const projectId = url.hostname
    const fileName = decodeURIComponent(url.pathname.slice(1))
    const filePath = path.join(PROJECTS_DIR, projectId, 'assets', fileName)

    if (!fs.existsSync(filePath)) {
      return new Response('Not found', { status: 404 })
    }

    const stat = fs.statSync(filePath)
    const fileSize = stat.size
    const ext = path.extname(filePath).toLowerCase()
    const contentType = MIME_TYPES[ext] || 'application/octet-stream'

    const rangeHeader = request.headers.get('range')
    if (rangeHeader) {
      const match = rangeHeader.match(/bytes=(\d+)-(\d*)/)
      if (match) {
        const start = parseInt(match[1], 10)
        const end = match[2] ? parseInt(match[2], 10) : fileSize - 1
        const chunkSize = end - start + 1
        const stream = fs.createReadStream(filePath, { start, end })
        return new Response(stream, {
          status: 206,
          headers: {
            'Content-Type': contentType,
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Content-Length': String(chunkSize),
            'Accept-Ranges': 'bytes',
          },
        })
      }
    }

    const stream = fs.createReadStream(filePath)
    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(fileSize),
        'Accept-Ranges': 'bytes',
      },
    })
  })

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'FluencyKaizen',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (!app.isPackaged) {
    // Dev mode: Vite dev server on port 3000
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  } else {
    // Prod mode: load built frontend from dist/
    mainWindow.loadFile(path.join(rootDir, 'dist', 'index.html'))
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
