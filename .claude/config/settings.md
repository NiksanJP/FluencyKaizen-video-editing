# Project Settings

Configuration for FluencyKaizen Video Automation.

## Project Identity

```
projectName: FluencyKaizen Video Automation
projectDescription: Automated short-form video production pipeline for Business English learners
version: 0.1.0
author: Content Creator
```

---

## Workspace

Directory structure and paths:

```
root: /Users/nik/Documents/fluencykaizen-video
inputDir: ./input                 # Drop raw MP4s here
outputDir: ./output               # Generated clips
pipelineDir: ./pipeline           # Processing scripts
remotionDir: ./remotion           # Rendering code
docsDir: ./docs                   # Documentation
```

---

## Tools

### bun

```
enabled: true
path: bun
version: 1.0+
```

TypeScript runtime and package manager. Required.

**Install**: `curl https://bun.sh | bash`

### ffmpeg

```
enabled: true
path: ffmpeg
version: 5.0+
required: true
```

Audio/video extraction. Required.

**Install**: `brew install ffmpeg`

### whisper

```
enabled: true
packageName: openai-whisper
version: 20240301+
required: true
pythonVersion: 3.8+
```

Local speech-to-text. Required.

**Install**: `pip install openai-whisper`

### remotion

```
enabled: true
version: 5.0+
workspace: ./remotion
```

Video composition and rendering framework.

**Part of**: npm dependencies (`bun install`)

---

## APIs

### gemini

```
enabled: true
provider: Google
model: gemini-2.5-flash
keyEnvar: GEMINI_API_KEY
required: true
```

Google Gemini API for content analysis.

**Rate Limits**:
```
requestsPerMinute: 60
tokensPerMinute: 1000000
```

**Fallback**: Error with helpful hint

---

## TypeScript Configuration

Strict type checking for code quality:

```
strict: true                    # Enable all strict type checks
noImplicitAny: true             # Error on implicit 'any' types
noUnusedLocals: true            # Error on unused variables
noUnusedParameters: true        # Error on unused parameters
resolveJsonModule: true         # Allow importing .json files
esModuleInterop: true           # ES module compatibility
```

---

## Formatting

### prettier

```
enabled: false
printWidth: 100
tabWidth: 2
trailingComma: es5
```

**Note**: Disabled (using project defaults)

### editorConfig

```
indentSize: 2
indentStyle: space
```

---

## Commands

Slash command configuration and timeouts:

### /process-video

```
script: bun pipeline/index.ts
timeout: 600            # 10 minutes
description: Full pipeline execution
```

### /preview

```
script: cd remotion && bun remotion studio
timeout: 0              # No timeout (interactive)
interactive: true
description: Remotion studio preview
```

### /render

```
script: cd remotion && bun remotion render ClipComposition
timeout: 600            # 10 minutes
description: Render to MP4
```

### /edit-clip

```
description: Natural language editing
requiresUserInput: true
```

### /validate-clip

```
script: bun pipeline/validate.ts
timeout: 10
description: Schema validation
```

### /list-clips

```
script: ls -lah output/
timeout: 5
description: List all clips
```

### /setup-env

```
script: bun pipeline/setup.ts
timeout: 300            # 5 minutes
description: Verify dependencies
```

### /test-pipeline

```
script: bun pipeline/test.ts
timeout: 60
description: Run tests
```

### /clean-output

```
script: bun pipeline/clean.ts
timeout: 30
requiresConfirmation: true
description: Clean temp files
```

---

## Monitoring

Logging and performance tracking:

```
logLevel: info                  # debug, info, warn, error
logDir: .claude/logs
maxLogSize: 10MB                # Rotate logs at this size
keepLogs: 7                     # Keep last 7 days of logs
trackPerformance: true          # Record timing metrics
```

---

## Validation

Schema and data integrity checking:

```
schemaFile: pipeline/types.ts

validateOnWrite: true           # Validate before saving
```

### validateClipJson

```
enabled: true
strict: true                    # Enforce strict compliance
checkCoverage: true             # Ensure subtitles cover full clip
checkTimestamps: true           # Verify timing consistency
```

---

## Hints & Tips

User guidance and feedback:

```
showTips: true                  # Show usage tips
suggestCommands: true           # Suggest relevant commands
warnOnErrors: true              # Alert on potential issues
verbosity: medium               # low, medium, high
```

---

## Git

Version control settings:

```
enabled: false                  # Git integration disabled
autoCommit: false               # Don't auto-commit
requiresBranchProtection: false # Allow direct pushes
```

**Note**: Manual git workflow recommended.

---

## Environment

Environment variables and secrets:

### requireDotEnv

```
requireDotEnv: true
envTemplate: .env.example
checkOnStartup: true
```

### Variables

#### GEMINI_API_KEY

```
required: true
masked: true                    # Hide in logs/output
description: Google Gemini API key
```

**Obtain**:
1. Go to https://ai.google.dev/
2. Create/use existing Google Cloud project
3. Generate API key
4. Save to `.env`: `GEMINI_API_KEY=sk-...`

#### WHISPER_MODEL

```
required: false
default: base                   # or: small, medium, large
description: Whisper model size (base, small, medium, large)
```

**Options**:
- `base` (default) — Fast, good accuracy
- `small` — Better accuracy, slower
- `medium` — High accuracy, much slower
- `large` — Best quality, very slow

---

## Performance

Resource limits and optimization:

```
cacheFrameworks: true           # Cache Remotion compilation
parallelRenders: false          # Sequential rendering (stability)
maxMemoryMB: 4096               # 4GB max per operation
timeoutMinutes: 10              # 10 min global timeout
```

---

## UI

Visual preferences (for Remotion Studio):

```
theme: dark                     # or: light
fontSize: 12
lineHeight: 1.5
showLineNumbers: true           # In code/JSON views
```

---

## Default Behavior

### On Startup

1. Load environment variables from `.env`
2. Verify required tools installed
3. Check directory structure
4. Validate schema definitions
5. Load project context

### On Command Execution

1. Verify user input (if required)
2. Get approval for dangerous operations
3. Execute with timeout protection
4. Log activity to `.claude/logs/`
5. Validate output (if schema-checked)

### On Error

1. Capture error details
2. Suggest fixes
3. Log to `.claude/logs/errors.log`
4. Notify Error Handler agent
5. Optionally retry (if transient)

---

## Overrides

To override settings for a specific session:

```bash
# Set environment variable
export LOG_LEVEL=debug

# Pass command-line flag
/process-video --verbose input/video.mp4

# Temporary setting
timeout 300 /render video_001
```

---

## Common Customizations

### Whisper Model (for quality)

```bash
export WHISPER_MODEL=small
/process-video input/video.mp4
```

### Debug Logging

```bash
export DEBUG=true
export LOG_LEVEL=debug
/process-video input/video.mp4
```

### Memory Limit (for large files)

Edit `maxMemoryMB`:
```
maxMemoryMB: 8192    # 8GB instead of 4GB
```

### Rendering Resolution

Edit render timeout / memory for 4K:
```
maxMemoryMB: 16384   # 16GB for 4K
```

---

## Troubleshooting

### Settings Not Applied

1. Restart terminal session
2. Run `/setup-env` to verify
3. Check `.env` file exists
4. Verify environment variables: `env | grep GEMINI`

### Tool Not Found

1. Check `path` setting matches installed location
2. Verify `version` requirement met
3. Run `which <tool>` to find location
4. Update `path` if needed

### Permission Issues

1. Check directory permissions: `ls -ld output/`
2. Fix if needed: `chmod 755 output/`
3. Check file ownership
4. Run `/setup-env` for full diagnostic

---

## See Also

- [mcp.md](./mcp.md) — MCP tool integration
- [CLAUDE.md](../CLAUDE.md) — Project architecture
- [agents/INDEX.md](../agents/INDEX.md) — Agent configuration
- [skills/INDEX.md](../skills/INDEX.md) — Command reference
