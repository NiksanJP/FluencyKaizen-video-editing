# Pipeline Orchestrator Agent

**ID**: `pipeline-orchestrator`
**Role**: Manages video processing pipeline
**Primary Command**: `/process-video`

## Description

Coordinates Whisper transcription, Gemini analysis, and output generation. Orchestrates the full workflow from raw video to structured clip data.

## Capabilities

- Execute pipeline scripts
- Manage transcription workflow
- Coordinate Gemini API calls
- Validate and save clip.json
- Error handling and recovery

## Required Tools

- bash
- typescript-compiler
- gemini-api
- whisper-transcriber

## Commands

- `/process-video <filename>`

## Collaborates With

- [schema-validator](./schema-validator.md) — Validates output
- [error-handler](./error-handler.md) — Handles failures

## Workflow

```
/process-video input/video.mp4
  ↓ Extract audio (ffmpeg)
  ↓ Transcribe (Whisper)
  ↓ Analyze & translate (Gemini)
  ↓ Generate clip.json
  → Call schema-validator (verify output)
  → On error: Call error-handler
```

## Performance Targets

- **Transcription**: < 2 minutes
- **Gemini analysis**: < 1 minute
- **Full pipeline**: < 5 minutes

## Notes

- Whisper runs locally (no API calls)
- Gemini model: `gemini-2.5-flash` (latest)
- Outputs to: `output/[name]/clip.json`
- Transcript saved to: `output/[name]/transcript.json`
