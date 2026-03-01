import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

const PROJECTS_DIR = path.resolve(__dirname, 'projects')

const MIME_TYPES = {
  '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm',
  '.avi': 'video/x-msvideo', '.mkv': 'video/x-matroska',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg',
  '.aac': 'audio/aac', '.flac': 'audio/flac',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp',
}

/** Vite plugin that serves project assets via HTTP with range-request support. */
function projectAssetsPlugin() {
  return {
    name: 'project-assets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const prefix = '/project-assets/'
        if (!req.url?.startsWith(prefix)) return next()

        // Parse /project-assets/:projectId/:fileName
        const rest = req.url.slice(prefix.length)
        const slashIdx = rest.indexOf('/')
        if (slashIdx === -1) return next()

        const projectId = rest.slice(0, slashIdx)
        const fileName = decodeURIComponent(rest.slice(slashIdx + 1))

        // Path traversal guard
        if (fileName.includes('..') || projectId.includes('..')) {
          res.statusCode = 400
          res.end('Bad request')
          return
        }

        const filePath = path.join(PROJECTS_DIR, projectId, 'assets', fileName)
        if (!fs.existsSync(filePath)) {
          res.statusCode = 404
          res.end('Not found')
          return
        }

        const stat = fs.statSync(filePath)
        const fileSize = stat.size
        const ext = path.extname(filePath).toLowerCase()
        const contentType = MIME_TYPES[ext] || 'application/octet-stream'

        const rangeHeader = req.headers.range
        if (rangeHeader) {
          const match = rangeHeader.match(/bytes=(\d+)-(\d*)/)
          if (match) {
            const start = parseInt(match[1], 10)
            const end = match[2] ? parseInt(match[2], 10) : fileSize - 1
            const chunkSize = end - start + 1
            res.writeHead(206, {
              'Content-Type': contentType,
              'Content-Range': `bytes ${start}-${end}/${fileSize}`,
              'Content-Length': chunkSize,
              'Accept-Ranges': 'bytes',
            })
            fs.createReadStream(filePath, { start, end }).pipe(res)
            return
          }
        }

        res.writeHead(200, {
          'Content-Type': contentType,
          'Content-Length': fileSize,
          'Accept-Ranges': 'bytes',
        })
        fs.createReadStream(filePath).pipe(res)
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), projectAssetsPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
  },
})
