# Setup Manager Agent

**ID**: `setup-manager`
**Role**: Manages project initialization and dependencies
**Primary Commands**: `/setup-env`, `/clean-output`

## Description

Handles environment setup, dependency installation, and health checks. Ensures all required tools and directories exist.

## Capabilities

- Verify system tools
- Check dependencies
- Manage environment variables
- Run setup scripts
- Generate setup reports

## Required Tools

- bash

## Collaborates With

- [error-handler](./error-handler.md) — Troubleshooting
- [performance-optimizer](./performance-optimizer.md) — Resource checks

## Workflow

### Setup Environment

```
/setup-env
  ↓ Check system tools (ffmpeg, bun, node)
  ↓ Verify whisper installation
  ↓ Check API keys (.env file)
  ↓ Verify directory structure
  ↓ Run dependency checks
  → Generate setup report
  → Suggest fixes if issues found
```

### Clean Output

```
/clean-output [video-name]
  ↓ Remove temporary files
  ↓ Keep clip.json, render.mp4
  ↓ Delete audio artifacts
  ↓ Clear logs (optional)
  → Report freed space
```

## System Requirements

### Required Tools

- **ffmpeg** 5.0+ — Audio/video extraction
- **bun** 1.0+ — TypeScript runtime
- **whisper** (openai-whisper) — Local transcription
- **Python 3.8+** — For whisper

### Optional Tools

- **nodejs** — If not using bun
- **git** — For version control
- **docker** — For isolated environment

## Environment Variables

```env
GEMINI_API_KEY=sk-... (required)
WHISPER_MODEL=base  (optional, default: base)
DEBUG=false         (optional)
LOG_LEVEL=info      (optional)
```

## Directory Structure

```
fluencykaizen-video/
  ├── input/              ← Drop raw MP4s here
  ├── output/             ← Generated clips
  ├── pipeline/           ← Processing scripts
  ├── remotion/           ← Rendering code
  ├── docs/               ← Documentation
  ├── .claude/            ← Config & agents
  ├── .env                ← API keys (gitignored)
  └── package.json        ← Dependencies
```

## Setup Checklist

- [ ] Install ffmpeg: `brew install ffmpeg`
- [ ] Install bun: `curl https://bun.sh | bash`
- [ ] Install whisper: `pip install openai-whisper`
- [ ] Clone repository
- [ ] Run `bun install`
- [ ] Create `.env` file with GEMINI_API_KEY
- [ ] Run `/setup-env` to verify

## Verification Steps

1. **System Tools**: ✓ ffmpeg, bun, whisper present
2. **Dependencies**: ✓ All npm packages installed
3. **Environment**: ✓ .env file with API key
4. **Directories**: ✓ input/, output/, .claude/ exist
5. **Permissions**: ✓ Can read/write to all dirs
6. **Network**: ✓ Can reach Gemini API (with key)

## Setup Report

After running `/setup-env`, you'll see:

```
✓ FFmpeg: 5.4.1
✓ Bun: 1.0.11
✓ Whisper: v20240301
✓ Node: 18.16.0
✓ Python: 3.9.12

✓ GEMINI_API_KEY set
✓ input/ directory writable
✓ output/ directory writable
✓ .claude/ config valid

Status: Ready to process videos
```

## Notes

- Idempotent: Safe to run multiple times
- Non-destructive: Doesn't delete any data
- Diagnostic: Reports all issues found
- Guided: Suggests exact fixes needed
