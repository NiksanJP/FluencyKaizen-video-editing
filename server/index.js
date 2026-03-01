import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import { projectsRouter } from './routes/projects.js'
import { assetsRouter } from './routes/assets.js'
import { captionsRouter } from './routes/captions.js'
import { createPtyManager } from './pty.js'

const app = express()
const server = createServer(app)
const PORT = 3001

app.use(cors())
app.use(express.json())

// API routes
app.use('/api/projects', projectsRouter)
app.use('/api/assets', assetsRouter)
app.use('/api/captions', captionsRouter)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// WebSocket for PTY
const wss = new WebSocketServer({ server, path: '/ws' })
const ptyManager = createPtyManager()

wss.on('connection', (ws) => {
  console.log('WebSocket client connected')
  const pty = ptyManager.spawn()

  pty.onData((data) => {
    try {
      ws.send(JSON.stringify({ type: 'output', data }))
    } catch (_) {}
  })

  pty.onExit(({ exitCode }) => {
    try {
      ws.send(JSON.stringify({ type: 'exit', exitCode }))
    } catch (_) {}
  })

  ws.on('message', (msg) => {
    try {
      const parsed = JSON.parse(msg.toString())
      if (parsed.type === 'input') {
        pty.write(parsed.data)
      } else if (parsed.type === 'resize') {
        pty.resize(parsed.cols, parsed.rows)
      }
    } catch (_) {}
  })

  ws.on('close', () => {
    console.log('WebSocket client disconnected')
    pty.kill()
  })
})

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
