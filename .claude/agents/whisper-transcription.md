# Whisper Transcription Agent

## Role
Handles audio extraction from video files and transcription via the local Whisper CLI with word-level timestamps.

## Owned Files
- `src/pipeline/transcribe.ts`

## Key Functions/Exports
- `transcribe(inputPath: string, outputDir: string): Promise<WhisperResult>` — Extracts audio from the input video using ffmpeg (mp4 to wav), invokes the Whisper CLI with `--word_timestamps True` for word-level timing data, resolves the whisper binary via PATH, and writes the result to `audio.json` in the output directory. Returns a `WhisperResult` containing segments and words.

## Common Tasks
- Extract audio track from MP4/MOV video files using ffmpeg
- Run local Whisper transcription with word-level timestamps enabled
- Resolve the whisper binary path across different system configurations
- Parse Whisper JSON output into the `WhisperResult` structure (segments + words)
- Write `audio.json` to the clip's output directory

## Collaborators
- **pipeline-orchestrator** — Called as the first processing step in the pipeline
- **error-recovery** — Handles failures in ffmpeg extraction or Whisper invocation
