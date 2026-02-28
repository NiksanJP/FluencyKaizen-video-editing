# /process-video

**Category**: Pipeline Processing
**Agent**: [Pipeline Orchestrator](../agents/pipeline-orchestrator.md)
**Requires Approval**: No

## Description

Run the full FluencyKaizen pipeline on a video file. Transcribes audio, analyzes content with Gemini, and generates structured clip data.

## Usage

```bash
/process-video <filename>

# Example:
/process-video input/video_001.mp4
```

## What It Does

1. **Extract Audio** — Extracts audio track from MP4 using FFmpeg
2. **Transcribe** — Uses Whisper to generate word-level transcript with timestamps
3. **Analyze** — Calls Gemini API to:
   - Select best 30-60s clip segment
   - Translate and clean up subtitles
   - Extract 3-5 vocabulary cards
   - Generate bilingual hook title
4. **Validate** — Checks output against ClipData schema
5. **Save** — Writes `clip.json` and `transcript.json`

## Output Files

```
output/video_001/
  ├── clip.json           ← Main artifact (edit this)
  ├── transcript.json     ← Word-level transcript
  ├── audio.wav           ← Extracted audio
  └── metadata.json       ← Processing metadata
```

## Time Targets

- **Extraction**: 30 seconds
- **Transcription**: < 2 minutes
- **Gemini Analysis**: < 1 minute
- **Total**: < 5 minutes

## Requirements

- Video file in `input/` directory
- Ffmpeg installed
- Whisper installed (`pip install openai-whisper`)
- GEMINI_API_KEY in `.env` file
- Run `/setup-env` first to verify

## Example

```bash
# Place video in input/
cp my_video.mp4 input/

# Run pipeline
/process-video input/my_video.mp4

# Check output
ls output/my_video/
# → clip.json, transcript.json, metadata.json
```

## Troubleshooting

**"ffmpeg: command not found"**
- Install: `brew install ffmpeg`

**"whisper: command not found"**
- Install: `pip install openai-whisper`

**"GEMINI_API_KEY not set"**
- Create `.env` file: `echo "GEMINI_API_KEY=sk-..." > .env`

**"Input file not found"**
- Make sure video is in `input/` directory

**Slow transcription**
- Try `export WHISPER_MODEL=base` (use smaller model)

## Next Steps

After running `/process-video`:

1. **Preview** — Run `/preview video_001` to see in Remotion Studio
2. **Edit** — Run `/edit-clip video_001` to adjust timing or text
3. **Validate** — Run `/validate-clip video_001` to check quality
4. **Render** — Run `/render video_001` to generate final MP4

## See Also

- [Pipeline Orchestrator](../agents/pipeline-orchestrator.md)
- [Editing Workflow](/edit-clip)
- [CLAUDE.md](../CLAUDE.md) — Architecture overview
