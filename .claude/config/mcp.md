# Model Context Protocol (MCP) Configuration

Integration with external tools and services for the FluencyKaizen video automation pipeline.

## Overview

MCP Servers provide Claude Code with access to specialized tools and capabilities:

- **filesystem** — Read/write files, manage directories
- **bash** — Execute shell commands
- **typescript** — Type checking, compilation, diagnostics
- **remotion** — Video composition and rendering
- **gemini** — Google Gemini API for content analysis
- **whisper** — Local speech-to-text transcription
- **ffmpeg** — Audio and video processing

---

## MCP Servers

### filesystem

**Purpose**: File system access for project files

**Enabled**: Yes

**Capabilities**:
- `read_files` — Read file contents
- `write_files` — Write/create files
- `list_directory` — Browse directories
- `search_files` — Find files by pattern

**Restrictions**:
- Respects `.gitignore`
- Cannot access parent directories
- Sensitive files (.env) require confirmation

**Use Cases**:
- Read pipeline scripts
- Write clip.json
- Manage project structure

---

### bash

**Purpose**: Shell command execution for system operations

**Enabled**: Yes

**Capabilities**:
- `execute_command` — Run arbitrary commands
- `run_pipeline_scripts` — Execute bun/npm scripts
- `manage_processes` — Start/stop services

**Restrictions**:
- `no_destructive_commands_without_confirmation` — Requires approval for rm, rm -rf, etc.
- `no_git_force_push` — Prevents overwriting shared branches

**Use Cases**:
- Run pipeline: `bun pipeline/index.ts`
- Start Remotion Studio
- Execute tests
- Manage dependencies

**Environment**: Inherits from user's shell (.zshrc, .bashrc)

---

### typescript

**Purpose**: TypeScript compilation and type analysis

**Enabled**: Yes

**Capabilities**:
- `type_checking` — Validate type compliance
- `compilation` — Compile TypeScript to JavaScript
- `diagnostics` — Report errors and warnings

**Config**:
```
strict: true
noImplicitAny: true
noUnusedLocals: true
noUnusedParameters: true
resolveJsonModule: true
esModuleInterop: true
```

**Use Cases**:
- Validate schema types
- Type-check pipeline scripts
- Generate JavaScript output
- Debug type errors

**Applies To**:
- `pipeline/types.ts` — ClipData schema
- `pipeline/*.ts` — Processing scripts
- `remotion/src/**/*.tsx` — React components

---

### remotion

**Purpose**: Remotion video composition framework integration

**Enabled**: Yes

**Capabilities**:
- `composition_preview` — Preview in Studio
- `frame_rendering` — Generate video frames
- `component_templates` — Access built-in components
- `animation_helpers` — Timing and easing functions

**Config**:
```
compositionRoot: "./remotion/src"
publicFolder: "./remotion/public"
outputFolder: "./output"
```

**Use Cases**:
- Start Remotion Studio: `remotion studio`
- Render composition: `remotion render ClipComposition`
- Debug components
- Preview before final render

**Composition**: `ClipComposition.tsx`

**Components**:
- `HookTitle` — Persistent title
- `BilingualCaption` — Synced captions
- `HighlightedText` — Colored vocabulary
- `VocabCard` — Popup definitions

---

### gemini

**Purpose**: Google Gemini API integration for content analysis

**Enabled**: Yes

**Capabilities**:
- `content_generation` — Generate structured content
- `token_counting` — Estimate API usage
- `error_handling` — Graceful error recovery

**Config**:
```
model: "gemini-2.5-flash"
safetySettings: "strict"
cacheResponses: true
```

**Authentication**:
```
Environment Variable: GEMINI_API_KEY
Required: Yes
Masked: Yes (for security)
```

**Use Cases**:
- Analyze video transcripts
- Clip segment selection
- Generate bilingual captions
- Extract vocabulary cards
- Create hook titles

**Model**: `gemini-2.5-flash` (latest, fast, cost-effective)

**API Limits**:
- Requests/minute: 60
- Tokens/minute: 1,000,000
- Fallback: Error with helpful hint

---

### whisper

**Purpose**: Local speech-to-text transcription

**Enabled**: Yes

**Capabilities**:
- `audio_extraction` — Extract audio from video
- `transcription` — Generate word-level transcript
- `segment_timing` — Extract timing information

**Config**:
```
model: "base"           # or: small, medium, large
language: "en"          # or: ja, auto-detect
fallbackLanguage: "ja"  # If primary fails
```

**Installation**:
```bash
pip install openai-whisper
# Verify: whisper --version
```

**Use Cases**:
- Extract audio track from MP4
- Transcribe bilingual (EN/JP) content
- Get word-level timestamps
- Detect language automatically

**Models**:
- `base` (default) — Fast, good for EN/JP
- `small` — Better accuracy
- `medium` — High accuracy, slower
- `large` — Best quality, very slow

---

### ffmpeg

**Purpose**: Audio and video processing

**Enabled**: Yes

**Capabilities**:
- `audio_extraction` — Extract audio track
- `format_conversion` — Convert between formats
- `stream_analysis` — Inspect media properties

**Config**:
```
audioFormat: "pcm_s16le"  # 16-bit PCM
sampleRate: 16000         # 16kHz for Whisper
channels: 1               # Mono
```

**Installation**:
```bash
brew install ffmpeg
# Verify: ffmpeg -version
```

**Use Cases**:
- Extract audio from MP4: `ffmpeg -i input.mp4 -q:a 9 -n audio.wav`
- Analyze media: `ffprobe input.mp4`
- Convert formats
- Adjust sample rate

---

## Context Providers

Additional context automatically loaded:

### projectStructure

**Enabled**: Yes

**Includes**:
- `pipeline/` — Processing scripts
- `remotion/src/` — React components
- `docs/` — Documentation
- `.claude/commands/` — Command definitions

**Excludes**:
- `node_modules/` — Dependencies
- `output/` — Generated files
- `.git/` — Version control

### activeClip

**Enabled**: Yes

**Purpose**: Load current clip.json into context

**Refresh**: On-demand (run `/list-clips` or `/validate-clip`)

### schemaReference

**Enabled**: Yes

**Purpose**: Keep ClipData schema available

**Source**: `pipeline/types.ts`

### commandReference

**Enabled**: Yes

**Purpose**: All available slash commands

**Source**: `.claude/commands/` folder

---

## Tools Configuration

### jsonValidation

```
enabled: true
schema: "pipeline/types.ts"
strict: true
```

Validates all JSON artifacts against ClipData schema.

### codeGeneration

```
enabled: true
typeChecking: "strict"
templates:
  - remotion/src/components/
  - pipeline/
```

Enforces type safety when generating code.

### apiSimulation

```
enabled: true
mock:
  gemini: "test/fixtures/gemini-response.json"
  whisper: "test/fixtures/whisper-output.json"
```

Uses fixtures for testing without real API calls.

---

## Caching

```
enabled: true
scope:
  - schema_definitions
  - command_descriptions
  - project_structure
ttl: 3600  # seconds (1 hour)
```

Caches frequently accessed definitions for performance.

---

## Logging & Monitoring

```
enabled: true
level: "info"  # debug, info, warn, error
channels:
  - console
  - file
logFile: ".claude/logs/claude.log"
```

All MCP activity logged to `.claude/logs/`.

---

## Hooks

Automated triggers:

```
beforePipelineRun: verify_env_and_input
afterClipGeneration: validate_schema
beforeRender: check_dependencies
onError: suggest_fixes
```

These hooks ensure quality at each stage.

---

## Troubleshooting

### MCP Server Not Responding

```bash
# Check status
echo $CLAUDE_MCP_DEBUG

# View logs
tail -f .claude/logs/claude.log

# Restart
# (usually automatic)
```

### Permission Denied Errors

```bash
# Check file permissions
ls -la output/

# Fix if needed
chmod 755 output/ input/ .claude/
```

### API Rate Limit

```
Gemini: Wait 1 minute before retrying
Whisper: Local, no limits
FFmpeg: Local, no limits
```

### Tool Not Found

```bash
# ffmpeg
brew install ffmpeg

# whisper
pip install openai-whisper

# bun/node
# Already installed (required for project)
```

---

## See Also

- [settings.md](./settings.md) — Project configuration
- [CLAUDE.md](../CLAUDE.md) — Architecture overview
- [Agents](../agents/INDEX.md) — Agent roles and tools
