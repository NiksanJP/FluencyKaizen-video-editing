import { Router } from 'express'
import fs from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

const router = Router()
const PROJECTS_DIR = path.resolve(import.meta.dirname, '../../projects')

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true })
}

// List all projects
router.get('/', async (req, res) => {
  await ensureDir(PROJECTS_DIR)
  const entries = await fs.readdir(PROJECTS_DIR, { withFileTypes: true })
  const projects = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    try {
      const data = await fs.readFile(
        path.join(PROJECTS_DIR, entry.name, 'project.json'),
        'utf-8'
      )
      projects.push(JSON.parse(data))
    } catch {
      // skip invalid project dirs
    }
  }

  projects.sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0))
  res.json(projects)
})

// Create project
router.post('/', async (req, res) => {
  const id = randomUUID()
  const now = Date.now()
  const project = {
    id,
    name: req.body.name || 'Untitled Project',
    createdAt: now,
    lastModified: now,
    composition: {
      width: 1080,
      height: 1920,
      fps: 30,
      durationInFrames: 900,
    },
    tracks: [],
  }

  const projectDir = path.join(PROJECTS_DIR, id)
  await ensureDir(projectDir)
  await ensureDir(path.join(projectDir, 'assets'))
  await fs.writeFile(
    path.join(projectDir, 'project.json'),
    JSON.stringify(project, null, 2)
  )

  res.status(201).json(project)
})

// Get project
router.get('/:id', async (req, res) => {
  try {
    const data = await fs.readFile(
      path.join(PROJECTS_DIR, req.params.id, 'project.json'),
      'utf-8'
    )
    res.json(JSON.parse(data))
  } catch {
    res.status(404).json({ error: 'Project not found' })
  }
})

// Update project
router.put('/:id', async (req, res) => {
  const filePath = path.join(PROJECTS_DIR, req.params.id, 'project.json')
  try {
    const existing = JSON.parse(await fs.readFile(filePath, 'utf-8'))
    const updated = { ...existing, ...req.body, lastModified: Date.now() }
    await fs.writeFile(filePath, JSON.stringify(updated, null, 2))
    res.json(updated)
  } catch {
    res.status(404).json({ error: 'Project not found' })
  }
})

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    await fs.rm(path.join(PROJECTS_DIR, req.params.id), {
      recursive: true,
      force: true,
    })
    res.json({ ok: true })
  } catch {
    res.status(404).json({ error: 'Project not found' })
  }
})

export { router as projectsRouter }
