# Skills Directory

All available slash commands for the FluencyKaizen video automation pipeline.

## Quick Reference

| Command | Description | Agent | Requires Approval |
|---------|-------------|-------|-------------------|
| [/process-video](./process-video.md) | Run full pipeline | Pipeline Orchestrator | No |
| [/render](./render.md) | Render to MP4 | Remotion Composer | Yes |
| [/edit-clip](./edit-clip.md) | Natural language editing | Clip Editor | No |
| [/preview](./preview.md) | Studio preview | Remotion Composer | No |
| [/validate-clip](./validate-clip.md) | Schema validation | Schema Validator | No |
| [/list-clips](./list-clips.md) | Show all clips | Documentation Curator | No |
| [/setup-env](./setup-env.md) | Verify dependencies | Setup Manager | No |
| [/test-pipeline](./test-pipeline.md) | Run tests | Test Coordinator | No |
| [/clean-output](./clean-output.md) | Remove temp files | Setup Manager | Yes |

## Command Categories

### Pipeline Processing
- `/process-video` — Full transcription, analysis, and clip generation

### Editing & Validation
- `/edit-clip` — Natural language edits
- `/validate-clip` — Schema compliance checks

### Rendering & Preview
- `/preview` — Interactive Remotion Studio
- `/render` — MP4 rendering

### Utility
- `/list-clips` — Show all generated clips
- `/setup-env` — Initialize environment
- `/test-pipeline` — Run all tests
- `/clean-output` — Clean temp files

## Usage Patterns

### Typical Workflow

```bash
# 1. Process a video
/process-video input/video.mp4

# 2. Preview the result (optional)
/preview video

# 3. Make edits (optional)
/edit-clip video

# 4. Render to MP4
/render video

# 5. Clean up temp files (optional)
/clean-output video
```

### Quick Validation

```bash
# Validate a clip
/validate-clip video

# List all clips
/list-clips

# Run full test suite
/test-pipeline
```

### Environment Management

```bash
# Verify system setup
/setup-env

# Clean all output
/clean-output
```

## Plugins

In addition to slash commands, the following plugins are available:

| Plugin | Description | Commands |
|--------|-------------|----------|
| remotion-studio | Video composition framework | `remotion studio`, `remotion render` |
| bun-runtime | TypeScript runtime | `bun run`, `bun install` |
| gemini-api | Content analysis | `generateContent`, `countTokens` |
| ffmpeg-processor | Audio/video processing | `ffmpeg`, `ffprobe` |
| whisper-transcriber | Speech-to-text | `whisper` |
| typescript-compiler | Type checking | `tsc`, `tsc --watch` |

## Help & Documentation

For detailed help on any command:

```bash
/help [command]

# Examples:
/help process-video
/help rendering
/help troubleshooting
```

## See Also

- [Agents](../agents/INDEX.md) — Agent responsibilities
- [Config](../config/INDEX.md) — Settings and integrations
- [CLAUDE.md](../CLAUDE.md) — Project overview
