#!/bin/bash
set -e

echo ""
echo "🎬 FluencyKaizen — Setup Script"
echo "================================"
echo ""

# ── Helpers ──────────────────────────────────────────────────────────────────
ok()   { echo "  ✅ $1"; }
warn() { echo "  ⚠️  $1"; }
info() { echo "  ℹ️  $1"; }
fail() { echo "  ❌ $1"; exit 1; }

# ── 1. Homebrew ───────────────────────────────────────────────────────────────
echo "📦 Checking Homebrew..."
if ! command -v brew &>/dev/null; then
  info "Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi
ok "Homebrew $(brew --version | head -1)"

# ── 2. ffmpeg ─────────────────────────────────────────────────────────────────
echo ""
echo "🎥 Checking ffmpeg..."
if ! command -v ffmpeg &>/dev/null; then
  info "Installing ffmpeg via Homebrew..."
  brew install ffmpeg
fi
ok "ffmpeg $(ffmpeg -version 2>&1 | head -1 | awk '{print $3}')"

# ── 3. Python 3 ───────────────────────────────────────────────────────────────
echo ""
echo "🐍 Checking Python 3..."
if ! command -v python3 &>/dev/null; then
  info "Installing python3 via Homebrew..."
  brew install python
fi
PYTHON=$(command -v python3)
ok "Python $($PYTHON --version)"

# ── 4. openai-whisper ─────────────────────────────────────────────────────────
echo ""
echo "🎤 Checking openai-whisper..."
if ! $PYTHON -c "import whisper" &>/dev/null; then
  info "Installing openai-whisper..."
  $PYTHON -m pip install openai-whisper --break-system-packages 2>/dev/null \
    || $PYTHON -m pip install openai-whisper
fi
WHISPER_VER=$($PYTHON -m pip show openai-whisper 2>/dev/null | grep Version | awk '{print $2}')
ok "openai-whisper $WHISPER_VER"

# ── 5. Bun ────────────────────────────────────────────────────────────────────
echo ""
echo "🥟 Checking Bun..."
if ! command -v bun &>/dev/null; then
  info "Installing Bun..."
  curl -fsSL https://bun.sh/install | bash
  export PATH="$HOME/.bun/bin:$PATH"
fi
ok "Bun $(bun --version)"

# ── 6. Node modules ───────────────────────────────────────────────────────────
echo ""
echo "📚 Installing JS dependencies..."
cd "$(dirname "$0")"
bun install
ok "node_modules installed"

# ── 7. .env ───────────────────────────────────────────────────────────────────
echo ""
echo "🔑 Checking .env..."
if [ ! -f .env ]; then
  cat > .env << 'EOF'
# Whisper model size: base | small | medium | large
WHISPER_MODEL=base

# Get your key at https://aistudio.google.com/apikey
GEMINI_API_KEY=
EOF
  warn ".env created — add your GEMINI_API_KEY before running the pipeline"
else
  if grep -q "GEMINI_API_KEY=$" .env 2>/dev/null || ! grep -q "GEMINI_API_KEY=" .env 2>/dev/null; then
    warn "GEMINI_API_KEY is not set in .env — add it before running the pipeline"
  else
    ok ".env looks good"
  fi
fi

# ── 8. Directories ────────────────────────────────────────────────────────────
echo ""
echo "📁 Checking directories..."
mkdir -p input output
ok "input/ and output/ exist"

# ── 9. Patch PATH in transcribe.ts ───────────────────────────────────────────
echo ""
echo "🔧 Patching PATH in transcribe.ts..."
PYTHON_BIN_DIR=$(dirname "$PYTHON")
TRANSCRIBE="pipeline/transcribe.ts"

# Find the directory containing the whisper binary
WHISPER_BIN=$(command -v whisper 2>/dev/null)
if [ -z "$WHISPER_BIN" ]; then
  fail "whisper binary not found even after install — check your pip setup"
fi
WHISPER_BIN_DIR=$(dirname "$WHISPER_BIN")

if grep -q "shellPath" "$TRANSCRIBE"; then
  NEW_LINE="  const shellPath = \`/opt/homebrew/bin:/usr/local/bin:${WHISPER_BIN_DIR}:/usr/bin:/bin:\${process.env.PATH || \"\"}\`;"
  $PYTHON - "$TRANSCRIBE" "$NEW_LINE" << 'PYEOF'
import sys, re
path, new_line = sys.argv[1], sys.argv[2]
with open(path) as f:
    content = f.read()
content = re.sub(r'  const shellPath = .*', new_line, content)
with open(path, 'w') as f:
    f.write(content)
PYEOF
  ok "transcribe.ts PATH updated (whisper at $WHISPER_BIN_DIR)"
else
  warn "Could not auto-patch transcribe.ts — ensure shellPath includes $WHISPER_BIN_DIR"
fi

# ── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo "================================"
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Drop a video into input/"
echo "  2. Run: bun process <filename>"
echo ""
