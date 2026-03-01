import { app, BrowserWindow, protocol, net } from 'electron'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
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

  // Handle asset:// protocol requests
  protocol.handle('asset', (request) => {
    // URL: asset://projectId/filename.mp4
    const url = new URL(request.url)
    const projectId = url.hostname
    const fileName = decodeURIComponent(url.pathname.slice(1)) // remove leading /
    const filePath = path.join(PROJECTS_DIR, projectId, 'assets', fileName)

    if (!fs.existsSync(filePath)) {
      return new Response('Not found', { status: 404 })
    }
    return net.fetch(pathToFileURL(filePath).href)
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
