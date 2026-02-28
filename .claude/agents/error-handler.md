# Error Handler Agent

**ID**: `error-handler`
**Role**: Manages failures and provides solutions
**Primary Command**: Global (all tasks)

## Description

Catches errors, suggests fixes, and helps recover from failures. Available as fallback for all agents when something goes wrong.

## Capabilities

- Parse error messages
- Suggest remediation steps
- Manage retries
- Log and document issues
- Provide troubleshooting guidance

## Required Tools

- bash
- typescript-compiler

## Collaborates With

- All agents (global support)

## Workflow

```
Any Task Error
  ↓ Error Handler catches exception
  ↓ Parse error message
  ↓ Identify root cause
  ↓ Check error type (e.g. missing file, API error, validation failure)
  → Suggest fix (e.g. "Install ffmpeg", "Check API key")
  → Offer retry
  → Log issue to .claude/logs/errors.log
```

## Common Issues & Solutions

### Transcription Errors

**"whisper: command not found"**
- Solution: `pip install openai-whisper`

**"No audio found in video"**
- Solution: Check video file is valid MP4 with audio track

### API Errors

**"GEMINI_API_KEY not set"**
- Solution: `export GEMINI_API_KEY=your_key_here`

**"Rate limit exceeded"**
- Solution: Wait a few minutes, then retry

**"Invalid API response"**
- Solution: Check network, API status, token quota

### Validation Errors

**"Subtitle times don't align with video"**
- Solution: Run `/validate-clip` to identify gaps, use `/edit-clip` to fix

**"Highlight words not found in Japanese text"**
- Solution: Check spelling or remove from highlights array

### File Errors

**"input/video.mp4 not found"**
- Solution: Place video in `input/` directory first

**"output/ directory not found"**
- Solution: Run `/setup-env` to create directories

### Rendering Errors

**"Remotion Studio won't start"**
- Solution: Kill existing process: `pkill -f remotion`

**"Render timeout"**
- Solution: Check disk space, reduce resolution, close other apps

## Logging & Recovery

- All errors logged to: `.claude/logs/errors.log`
- Issues tracked by agent: `.claude/logs/agents/error-handler.log`
- Recovery steps automatically attempted
- User notified with actionable guidance

## Notes

- Always available as fallback
- No "hard failures" — always suggests a path forward
- Works with all other agents transparently
- Part of safety guardrails
