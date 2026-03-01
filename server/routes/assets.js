import { Router } from 'express'
import fs from 'fs/promises'
import path from 'path'
import { execSync } from 'child_process'
import multer from 'multer'

function probeMediaDuration(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  const isMedia = /^\.(mp4|mov|webm|avi|mkv|mp3|wav|ogg|aac|m4a|flac)$/.test(ext)
  if (!isMedia) return null
  try {
    const out = execSync(
      `ffprobe -v quiet -print_format json -show_format "${filePath}"`,
      { timeout: 10000 }
    ).toString()
    const duration = parseFloat(JSON.parse(out).format?.duration)
    return Number.isFinite(duration) && duration > 0 ? duration : null
  } catch {
    return null
  }
}

const router = Router()
const PROJECTS_DIR = path.resolve(import.meta.dirname, '../../projects')

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const dir = path.join(PROJECTS_DIR, req.params.id, 'assets')
    await fs.mkdir(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname)
  },
})

const upload = multer({ storage })

// Upload asset
router.post('/:id/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' })
  }
  const duration = probeMediaDuration(req.file.path)
  res.json({
    name: req.file.originalname,
    size: req.file.size,
    path: `/api/assets/${req.params.id}/${req.file.originalname}`,
    ...(duration != null && { duration }),
  })
})

// List assets for a project
router.get('/:id', async (req, res) => {
  const assetsDir = path.join(PROJECTS_DIR, req.params.id, 'assets')
  try {
    const files = await fs.readdir(assetsDir)
    const assets = []
    for (const file of files) {
      const filePath = path.join(assetsDir, file)
      const stat = await fs.stat(filePath)
      const duration = probeMediaDuration(filePath)
      assets.push({
        name: file,
        size: stat.size,
        lastModified: stat.mtimeMs,
        path: `/api/assets/${req.params.id}/${file}`,
        ...(duration != null && { duration }),
      })
    }
    res.json(assets)
  } catch {
    res.json([])
  }
})

// Serve asset file
router.get('/:id/:file', async (req, res) => {
  const filePath = path.join(PROJECTS_DIR, req.params.id, 'assets', req.params.file)
  try {
    await fs.access(filePath)
    res.sendFile(filePath)
  } catch {
    res.status(404).json({ error: 'Asset not found' })
  }
})

// Delete asset
router.delete('/:id/:file', async (req, res) => {
  const filePath = path.join(PROJECTS_DIR, req.params.id, 'assets', req.params.file)
  try {
    await fs.unlink(filePath)
    res.json({ ok: true })
  } catch {
    res.status(404).json({ error: 'Asset not found' })
  }
})

export { router as assetsRouter }
