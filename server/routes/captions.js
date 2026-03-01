import { Router } from 'express'
import { spawn } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import { analyzeWithGemini } from '../lib/analyze.js'

const router = Router()
const PROJECTS_DIR = path.resolve(import.meta.dirname, '../../projects')

/** Build the cache file path for a given asset's captions */
function captionCachePath(projectDir, assetName) {
  const baseName = path.basename(assetName, path.extname(assetName))
  return path.join(projectDir, 'captions', `${baseName}.json`)
}

/**
 * POST /api/captions/:projectId/generate
 * Body: { assetName: string }
 *
 * Uses Server-Sent Events to stream progress updates.
 * Stages: extracting → transcribing → analyzing → complete
 */
router.post('/:projectId/generate', async (req, res) => {
  const { projectId } = req.params
  const { assetName } = req.body

  if (!assetName) {
    return res.status(400).json({ error: 'assetName is required' })
  }

  const projectDir = path.join(PROJECTS_DIR, projectId)
  const assetsDir = path.join(projectDir, 'assets')
  const assetPath = path.join(assetsDir, assetName)

  // Validate project and asset exist
  try {
    await fs.access(path.join(projectDir, 'project.json'))
  } catch {
    return res.status(404).json({ error: 'Project not found' })
  }

  try {
    await fs.access(assetPath)
  } catch {
    return res.status(404).json({ error: `Asset "${assetName}" not found` })
  }

  // Set up SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  // Track child processes for cleanup on disconnect
  const childProcesses = []
  let aborted = false

  req.on('close', () => {
    aborted = true
    for (const cp of childProcesses) {
      try { cp.kill() } catch {}
    }
  })

  const tempDir = path.join(projectDir, 'captions-temp')

  try {
    await fs.mkdir(tempDir, { recursive: true })

    // Stage 1: Extract audio with ffmpeg
    sendEvent({ type: 'progress', stage: 'extracting', percent: 10, message: 'Extracting audio...' })

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

    if (aborted) return

    sendEvent({ type: 'progress', stage: 'extracting', percent: 25, message: 'Audio extracted' })

    // Stage 2: Transcribe with Whisper
    sendEvent({ type: 'progress', stage: 'transcribing', percent: 30, message: 'Transcribing with Whisper...' })

    const transcriptPath = path.join(tempDir, 'transcript.json')
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
        // Send periodic progress during transcription
        if (stderr.includes('%|')) {
          sendEvent({ type: 'progress', stage: 'transcribing', percent: 40, message: 'Whisper processing...' })
        }
      })
      proc.on('close', (code) => {
        if (aborted) return reject(new Error('Aborted'))
        if (code !== 0) return reject(new Error(`Whisper failed (code ${code}): ${stderr.slice(-200)}`))
        resolve()
      })
      proc.on('error', reject)
    })

    if (aborted) return

    sendEvent({ type: 'progress', stage: 'transcribing', percent: 55, message: 'Transcription complete' })

    // Read Whisper output — Whisper names the output after the input file
    const whisperOutputName = 'audio.json'
    const whisperPath = path.join(tempDir, whisperOutputName)
    let transcript
    try {
      const raw = await fs.readFile(whisperPath, 'utf-8')
      transcript = JSON.parse(raw)
    } catch {
      // Fallback: try the transcriptPath directly
      try {
        const raw = await fs.readFile(transcriptPath, 'utf-8')
        transcript = JSON.parse(raw)
      } catch {
        throw new Error('Could not find Whisper output file')
      }
    }

    // Stage 3: Analyze with Gemini
    sendEvent({ type: 'progress', stage: 'analyzing', percent: 60, message: 'Analyzing with Gemini...' })

    const clipData = await analyzeWithGemini(transcript, assetName)

    if (aborted) return

    sendEvent({ type: 'progress', stage: 'analyzing', percent: 90, message: 'Analysis complete' })

    // Cache the result (non-fatal)
    try {
      const cachePath = captionCachePath(projectDir, assetName)
      await fs.mkdir(path.dirname(cachePath), { recursive: true })
      await fs.writeFile(cachePath, JSON.stringify(clipData, null, 2))
    } catch (cacheErr) {
      console.warn('Failed to cache captions:', cacheErr.message)
    }

    // Complete
    sendEvent({ type: 'complete', data: clipData })
  } catch (error) {
    if (!aborted) {
      console.error('Caption generation error:', error)
      sendEvent({ type: 'error', message: error.message || 'Unknown error' })
    }
  } finally {
    // Clean up temp files
    try {
      await fs.rm(tempDir, { recursive: true, force: true })
    } catch {}
    res.end()
  }
})

/**
 * GET /api/captions/:projectId/:assetName
 * Returns cached captions for the given asset, or 404 if none exist.
 */
router.get('/:projectId/:assetName', async (req, res) => {
  const { projectId, assetName } = req.params
  const projectDir = path.join(PROJECTS_DIR, projectId)
  const cachePath = captionCachePath(projectDir, assetName)

  try {
    const raw = await fs.readFile(cachePath, 'utf-8')
    res.json(JSON.parse(raw))
  } catch {
    res.status(404).json({ error: 'No cached captions' })
  }
})

export { router as captionsRouter }
