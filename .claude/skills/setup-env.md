# /setup-env

**Category**: Setup & Configuration
**Agent**: [Setup Manager](../agents/setup-manager.md)
**Requires Approval**: No

## Description

Setup and verify all project dependencies. Ensures your system has everything needed to run the pipeline.

## Usage

```bash
/setup-env

# Optional: show detailed report
/setup-env --verbose

# Check specific tools
/setup-env --check ffmpeg
/setup-env --check whisper
```

## What It Checks

### System Tools

- ✓ **FFmpeg** 5.0+ — Audio/video extraction
- ✓ **Bun** 1.0+ — TypeScript runtime
- ✓ **Python** 3.8+ — For Whisper
- ✓ **Whisper** — Speech-to-text
- ✓ **Node** (optional) — Alternative runtime

### Dependencies

- ✓ **npm/bun packages** — All installed
- ✓ **TypeScript** — Compiler available
- ✓ **Remotion** — Video rendering

### Environment

- ✓ **.env file** — GEMINI_API_KEY present
- ✓ **API key valid** — Can reach Gemini API
- ✓ **Environment variables** — All set correctly

### Directories

- ✓ **input/** — Exists and writable
- ✓ **output/** — Exists and writable
- ✓ **.claude/** — Config present
- ✓ **pipeline/** — Scripts present
- ✓ **remotion/** — Workspace present

### Permissions

- ✓ **Read/write** — All directories accessible
- ✓ **Execute** — Scripts can run
- ✓ **Process** — Can spawn subprocesses

## Example Output

```
✓ FluencyKaizen Setup Verification

System Tools
  ✓ FFmpeg: 5.4.1
  ✓ Bun: 1.0.11
  ✓ Python: 3.9.12
  ✓ Whisper: v20240301
  ✓ Node: 18.16.0

Dependencies
  ✓ @google/generative-ai: latest
  ✓ remotion: 5.0.0
  ✓ react: 18.2.0
  ✓ typescript: 5.3.3

Environment
  ✓ .env file exists
  ✓ GEMINI_API_KEY set (****)
  ✓ Can reach Gemini API
  ✓ Default model: gemini-2.5-flash

Directories
  ✓ input/ (writable, 0 files)
  ✓ output/ (writable, 0 files)
  ✓ .claude/ (config present)
  ✓ pipeline/ (3 scripts)
  ✓ remotion/ (React workspace)

Permissions
  ✓ Read/write access to all directories
  ✓ Can execute scripts
  ✓ Can spawn processes

Status: ✓ Ready to process videos
Next: /process-video input/sample.mp4
```

## Example with Issues

```
✗ FluencyKaizen Setup Verification

⚠ Issues Found:

1. Missing Tool: ffmpeg
   Location: system PATH
   Fix: brew install ffmpeg

2. Missing Tool: whisper
   Location: Python pip
   Fix: pip install openai-whisper

3. Missing File: .env
   Location: project root
   Fix: cp .env.example .env
        Edit .env and add GEMINI_API_KEY

4. Directory Not Writable: output/
   Location: /Users/nik/Documents/fluencykaizen-video/output/
   Fix: chmod 755 output/

5. Missing Dependency: @google/generative-ai
   Location: node_modules
   Fix: bun install

Status: ✗ Not ready
Next: Fix issues above, then run /setup-env again
```

## Installation Quick Start

If setup finds missing tools:

```bash
# Install FFmpeg (macOS)
brew install ffmpeg

# Install Whisper
pip install openai-whisper

# Install Node dependencies
bun install

# Create .env file
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Run setup again
/setup-env
```

## Environment Setup

### .env File

```bash
# Create from template
cp .env.example .env

# Edit and add your key
export GEMINI_API_KEY=sk-... your key here ...

# Optional settings
export WHISPER_MODEL=base          # or small, medium, large
export DEBUG=false                 # or true for verbose logs
export LOG_LEVEL=info              # or debug, warn
```

### Load Environment

```bash
# Once per session
source .env

# Or add to ~/.zshrc for automatic loading
echo 'source /path/to/.env' >> ~/.zshrc
```

## System Requirements

| Tool | Version | Purpose | Install |
|------|---------|---------|---------|
| FFmpeg | 5.0+ | Audio extraction | `brew install ffmpeg` |
| Bun | 1.0+ | Runtime | `curl https://bun.sh \| bash` |
| Python | 3.8+ | Whisper runtime | `brew install python@3.9` |
| Whisper | latest | Transcription | `pip install openai-whisper` |
| Disk | 10GB+ | Video processing | — |
| RAM | 4GB+ | Rendering | — |

## Disk Space

Estimate per video:

- **Input MP4**: 100MB - 500MB
- **Audio extraction**: 20MB - 50MB
- **Transcripts**: 1MB - 5MB
- **Rendered MP4**: 20MB - 50MB
- **Total**: 150MB - 600MB per video

**Total needed**: ~10GB for comfort

## Troubleshooting

**"FFmpeg not found"**
```bash
# Install
brew install ffmpeg

# Verify
ffmpeg -version
```

**"Python not found"**
```bash
# Install
brew install python@3.9

# Verify
python3 --version
```

**"Whisper not installed"**
```bash
# Install
pip install openai-whisper

# Verify
whisper --version
```

**"API key not working"**
```bash
# Check key exists
echo $GEMINI_API_KEY

# Check validity (make a test API call)
/test-pipeline --api-only
```

**"Permission denied"**
```bash
# Fix permissions
chmod 755 input/ output/ .claude/

# Check
ls -ld input/ output/
```

## Next Steps

After successful setup:

1. **Process a video** — `/process-video input/video.mp4`
2. **Preview result** — `/preview video`
3. **Edit if needed** — `/edit-clip video`
4. **Render final** — `/render video`

## See Also

- [Setup Manager](../agents/setup-manager.md)
- [CLAUDE.md](../CLAUDE.md) — Project overview
- [/process-video](./process-video.md) — First command to run
- [Troubleshooting Guide](../../docs/troubleshooting.md)
