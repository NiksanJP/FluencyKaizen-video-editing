# /setup-env — Setup and verify project dependencies

## Usage
```
/setup-env
```

## Description
Performs a complete setup check and initialization of all FluencyKaizen dependencies.

Verifies:
- ✅ Bun installed and working
- ✅ Node/npm installed (for fallback)
- ✅ FFmpeg installed with audio support
- ✅ Whisper installed via pip
- ✅ Python 3.8+ for Whisper
- ✅ .env file exists with GEMINI_API_KEY
- ✅ All npm/bun packages installed
- ✅ Whisper models downloaded locally
- ✅ Remotion dependencies ready
- ✅ Project directories created

## What It Does

### 1. System Tools Check
```bash
✓ bun --version          → 1.0.14
✓ ffmpeg -version        → 6.0
✓ python --version       → 3.11.7
✓ whisper --version      → 20240301
```

### 2. Dependencies Installation
```bash
✓ bun install            → Installs root + remotion packages
✓ pip install openai-whisper  → Latest Whisper package
```

### 3. Model Download
```bash
✓ Whisper model cache    → ~/.cache/whisper/base.pt
  Size: ~140 MB
  (downloads on first /process-video if missing)
```

### 4. API Key Check
```bash
✓ .env file exists
✓ GEMINI_API_KEY set (length: 50+ chars)
```

### 5. Directory Structure
```bash
✓ input/                 → Created
✓ output/                → Created
✓ remotion/public/       → Created
✓ pipeline/              → Ready
✓ docs/                  → Complete
```

## Example Output
```
🔧 FluencyKaizen Environment Setup
=====================================

System Tools
  ✓ Bun 1.0.14
  ✓ FFmpeg 6.0
  ✓ Python 3.11.7
  ✓ Whisper 20240301

Dependencies
  ✓ Root packages installed (2 deps)
  ✓ Remotion workspace ready
  ✓ TypeScript configured
  ✓ Bun workspace linked

API & Secrets
  ✓ .env file found
  ✓ GEMINI_API_KEY set (50 chars)

Models & Data
  ⏳ Whisper base model - will download on first use (140 MB)
  ✓ All project docs present

Directories
  ✓ input/
  ✓ output/
  ✓ remotion/public/
  ✓ pipeline/
  ✓ docs/

📋 Setup Complete!
Ready to run: /process-video <filename>
```

## Troubleshooting

### "bun not found"
```bash
curl -fsSL https://bun.sh/install | bash
```

### "ffmpeg not found"
```bash
# macOS
brew install ffmpeg

# Linux
apt-get install ffmpeg
```

### "whisper not found"
```bash
pip install openai-whisper
```

### "GEMINI_API_KEY not set"
```bash
# 1. Get key from https://aistudio.google.com/app/apikey
# 2. Create .env file:
GEMINI_API_KEY=your_key_here

# 3. Run /setup-env again
```

### "Out of disk space"
Whisper models take ~140 MB + video processing needs space:
- Recommended: 50 GB free
- Minimum: 20 GB free

## Post-Setup

After successful setup, you can:
```
/process-video input/example.mp4
/preview example
/render example
```

All tools are configured and ready!
