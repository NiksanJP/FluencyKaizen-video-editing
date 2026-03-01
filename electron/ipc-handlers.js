import { ipcMain, app } from 'electron'
import fs from 'fs/promises'
import fsSync from 'fs'
import path from 'path'
import chokidar from 'chokidar'
import { randomUUID } from 'crypto'
import { execSync, spawn } from 'child_process'
import pty from 'node-pty'
import os from 'os'
import { registerExportHandlers } from './export-handler.js'

const PROJECTS_DIR = path.resolve(app.getAppPath(), 'projects')

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true })
}

// ── ffprobe helper ──────────────────────────────────────────────────────────

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

// ── Projects ────────────────────────────────────────────────────────────────

function registerProjectHandlers() {
  ipcMain.handle('projects:list', async () => {
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
      } catch {}
    }
    projects.sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0))
    return projects
  })

  ipcMain.handle('projects:get', async (_e, id) => {
    const data = await fs.readFile(
      path.join(PROJECTS_DIR, id, 'project.json'),
      'utf-8'
    )
    return JSON.parse(data)
  })

  ipcMain.handle('projects:create', async (_e, name) => {
    const id = randomUUID()
    const now = Date.now()
    const project = {
      id,
      name: name || 'Untitled Project',
      createdAt: now,
      lastModified: now,
      composition: { width: 1080, height: 1920, fps: 30, durationInFrames: 900 },
      tracks: [],
    }
    const projectDir = path.join(PROJECTS_DIR, id)
    await ensureDir(projectDir)
    await ensureDir(path.join(projectDir, 'assets'))
    await fs.writeFile(
      path.join(projectDir, 'project.json'),
      JSON.stringify(project, null, 2)
    )
    return project
  })

  ipcMain.handle('projects:update', async (_e, id, updates) => {
    const filePath = path.join(PROJECTS_DIR, id, 'project.json')
    const existing = JSON.parse(await fs.readFile(filePath, 'utf-8'))
    const updated = { ...existing, ...updates, lastModified: Date.now() }
    await fs.writeFile(filePath, JSON.stringify(updated, null, 2))
    return updated
  })

  ipcMain.handle('projects:delete', async (_e, id) => {
    await fs.rm(path.join(PROJECTS_DIR, id), { recursive: true, force: true })
    return { ok: true }
  })
}

// ── Assets ──────────────────────────────────────────────────────────────────

function registerAssetHandlers() {
  ipcMain.handle('assets:list', async (_e, projectId) => {
    const assetsDir = path.join(PROJECTS_DIR, projectId, 'assets')
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
          path: `asset://${projectId}/${file}`,
          ...(duration != null && { duration }),
        })
      }
      return assets
    } catch {
      return []
    }
  })

  ipcMain.handle('assets:upload', async (_e, projectId, fileName, buffer) => {
    const assetsDir = path.join(PROJECTS_DIR, projectId, 'assets')
    await ensureDir(assetsDir)
    const filePath = path.join(assetsDir, fileName)
    await fs.writeFile(filePath, Buffer.from(buffer))
    const duration = probeMediaDuration(filePath)
    const stat = await fs.stat(filePath)
    return {
      name: fileName,
      size: stat.size,
      path: `asset://${projectId}/${fileName}`,
      ...(duration != null && { duration }),
    }
  })

  ipcMain.handle('assets:delete', async (_e, projectId, fileName) => {
    const filePath = path.join(PROJECTS_DIR, projectId, 'assets', fileName)
    await fs.unlink(filePath)
    return { ok: true }
  })

  // Resolve asset:// path to absolute file path (used by custom protocol)
  ipcMain.handle('assets:resolve', async (_e, projectId, fileName) => {
    const filePath = path.join(PROJECTS_DIR, projectId, 'assets', fileName)
    await fs.access(filePath)
    return filePath
  })
}

// ── Captions ────────────────────────────────────────────────────────────────

function captionCachePath(projectDir, assetName) {
  const baseName = path.basename(assetName, path.extname(assetName))
  return path.join(projectDir, 'captions', `${baseName}.json`)
}

function registerCaptionHandlers() {
  ipcMain.handle('captions:get', async (_e, projectId, assetName) => {
    const projectDir = path.join(PROJECTS_DIR, projectId)
    const cachePath = captionCachePath(projectDir, assetName)
    try {
      const raw = await fs.readFile(cachePath, 'utf-8')
      return JSON.parse(raw)
    } catch {
      return null
    }
  })

  // Caption generation uses event-based streaming via sender.send()
  ipcMain.handle('captions:generate', async (event, projectId, assetName) => {
    const sender = event.sender
    const projectDir = path.join(PROJECTS_DIR, projectId)
    const assetsDir = path.join(projectDir, 'assets')
    const assetPath = path.join(assetsDir, assetName)

    // Validate
    await fs.access(path.join(projectDir, 'project.json'))
    await fs.access(assetPath)

    const sendProgress = (data) => {
      if (!sender.isDestroyed()) {
        sender.send('captions:progress', data)
      }
    }

    const childProcesses = []
    let aborted = false

    // Listen for abort from renderer
    const abortHandler = () => { aborted = true }
    ipcMain.once('captions:abort', abortHandler)

    const tempDir = path.join(projectDir, 'captions-temp')

    try {
      await fs.mkdir(tempDir, { recursive: true })

      // Stage 1: Extract audio
      sendProgress({ type: 'progress', stage: 'extracting', percent: 10, message: 'Extracting audio...' })

      const audioPath = path.join(tempDir, 'audio.wav')
      await new Promise((resolve, reject) => {
        const proc = spawn('ffmpeg', [
          '-i', assetPath,
          '-vn', '-acodec', 'pcm_s16le', '-ar', '16000', '-ac', '1',
          '-y', audioPath,
        ])
        childProcesses.push(proc)
        let stderr = ''
        proc.stderr.on('data', (chunk) => { stderr += chunk.toString() })
        proc.on('close', (code) => {
          if (aborted) return reject(new Error('Aborted'))
          if (code !== 0) return reject(new Error(`ffmpeg failed (code ${code}): ${stderr.slice(-200)}`))
          resolve()
        })
        proc.on('error', reject)
      })

      if (aborted) return { error: 'Aborted' }

      sendProgress({ type: 'progress', stage: 'extracting', percent: 25, message: 'Audio extracted' })

      // Stage 2: Transcribe with Whisper
      sendProgress({ type: 'progress', stage: 'transcribing', percent: 30, message: 'Transcribing with Whisper...' })

      await new Promise((resolve, reject) => {
        const proc = spawn('python3', [
          '-m', 'whisper',
          audioPath,
          '--model', 'base',
          '--output_format', 'json',
          '--output_dir', tempDir,
          '--word_timestamps', 'True',
        ])
        childProcesses.push(proc)
        let stderr = ''
        proc.stderr.on('data', (chunk) => {
          stderr += chunk.toString()
          if (stderr.includes('%|')) {
            sendProgress({ type: 'progress', stage: 'transcribing', percent: 40, message: 'Whisper processing...' })
          }
        })
        proc.on('close', (code) => {
          if (aborted) return reject(new Error('Aborted'))
          if (code !== 0) return reject(new Error(`Whisper failed (code ${code}): ${stderr.slice(-200)}`))
          resolve()
        })
        proc.on('error', reject)
      })

      if (aborted) return { error: 'Aborted' }

      sendProgress({ type: 'progress', stage: 'transcribing', percent: 55, message: 'Transcription complete' })

      // Read Whisper output
      let transcript
      const whisperPath = path.join(tempDir, 'audio.json')
      const transcriptPath = path.join(tempDir, 'transcript.json')
      try {
        transcript = JSON.parse(await fs.readFile(whisperPath, 'utf-8'))
      } catch {
        try {
          transcript = JSON.parse(await fs.readFile(transcriptPath, 'utf-8'))
        } catch {
          throw new Error('Could not find Whisper output file')
        }
      }

      // Stage 3: Analyze with Gemini
      sendProgress({ type: 'progress', stage: 'analyzing', percent: 60, message: 'Analyzing with Gemini...' })

      // Dynamic import to keep analyze.js as-is
      const { analyzeWithGemini } = await import('../server/lib/analyze.js')
      const clipData = await analyzeWithGemini(transcript, assetName, { backfillTranscript: transcript })

      if (aborted) return { error: 'Aborted' }

      sendProgress({ type: 'progress', stage: 'analyzing', percent: 90, message: 'Analysis complete' })

      // Cache
      try {
        const cachePath = captionCachePath(projectDir, assetName)
        await fs.mkdir(path.dirname(cachePath), { recursive: true })
        await fs.writeFile(cachePath, JSON.stringify(clipData, null, 2))
      } catch (cacheErr) {
        console.warn('Failed to cache captions:', cacheErr.message)
      }

      sendProgress({ type: 'complete', data: clipData })
      return clipData
    } catch (error) {
      if (!aborted) {
        console.error('Caption generation error:', error)
        sendProgress({ type: 'error', message: error.message || 'Unknown error' })
      }
      // Kill child processes
      for (const cp of childProcesses) {
        try { cp.kill() } catch {}
      }
      throw error
    } finally {
      ipcMain.removeListener('captions:abort', abortHandler)
      try {
        await fs.rm(tempDir, { recursive: true, force: true })
      } catch {}
    }
  })
}

// ── PTY ─────────────────────────────────────────────────────────────────────

function registerPtyHandlers() {
  const ptyProcesses = new Map()

  ipcMain.handle('pty:spawn', (event, options = {}) => {
    const id = randomUUID()
    const shell = os.platform() === 'win32' ? 'powershell.exe' : process.env.SHELL || '/bin/zsh'
    const cwd = app.isPackaged ? app.getPath('home') : path.resolve(app.getAppPath())

    const ptyProcess = pty.spawn('claude', ['--dangerously-skip-permissions'], {
      name: 'xterm-256color',
      cols: 120,
      rows: 30,
      cwd,
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor',
        FLUENCYKAIZEN_PROJECT_ID: options.projectId || '',
        FLUENCYKAIZEN_PROJECTS_DIR: PROJECTS_DIR,
      },
    })

    ptyProcesses.set(id, ptyProcess)
    const sender = event.sender

    ptyProcess.onData((data) => {
      if (!sender.isDestroyed()) {
        sender.send('pty:output', id, data)
      }
    })

    ptyProcess.onExit(({ exitCode }) => {
      if (!sender.isDestroyed()) {
        sender.send('pty:exit', id, exitCode)
      }
      ptyProcesses.delete(id)
    })

    return id
  })

  ipcMain.on('pty:input', (_e, id, data) => {
    const p = ptyProcesses.get(id)
    if (p) p.write(data)
  })

  ipcMain.on('pty:resize', (_e, id, cols, rows) => {
    const p = ptyProcesses.get(id)
    if (p) p.resize(cols, rows)
  })

  ipcMain.on('pty:kill', (_e, id) => {
    const p = ptyProcesses.get(id)
    if (p) {
      p.kill()
      ptyProcesses.delete(id)
    }
  })
}

// ── File Watcher ─────────────────────────────────────────────────────────────

function registerFileWatcherHandlers() {
  const watchers = new Map()

  ipcMain.handle('watch:project', (event, projectId) => {
    // Clean up any existing watcher for this project
    const existing = watchers.get(projectId)
    if (existing) {
      existing.close()
      watchers.delete(projectId)
    }

    const filePath = path.join(PROJECTS_DIR, projectId, 'project.json')
    const sender = event.sender

    let debounceTimer = null
    try {
      const watcher = chokidar.watch(filePath, {
        ignoreInitial: true,
        awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
      })

      watcher.on('change', () => {
        clearTimeout(debounceTimer)
        debounceTimer = setTimeout(() => {
          if (!sender.isDestroyed()) {
            sender.send('project:external-change', projectId)
          }
        }, 300)
      })

      watcher.on('error', () => {
        watcher.close()
        watchers.delete(projectId)
      })

      watchers.set(projectId, watcher)
      return { ok: true }
    } catch (err) {
      console.warn('Failed to watch project file:', err.message)
      return { ok: false, error: err.message }
    }
  })

  ipcMain.on('watch:stop', (_e, projectId) => {
    const watcher = watchers.get(projectId)
    if (watcher) {
      watcher.close()
      watchers.delete(projectId)
    }
  })
}

// ── Register all ────────────────────────────────────────────────────────────

export function registerAllHandlers() {
  registerProjectHandlers()
  registerAssetHandlers()
  registerCaptionHandlers()
  registerPtyHandlers()
  registerFileWatcherHandlers()
  registerExportHandlers()
}

export { PROJECTS_DIR }
