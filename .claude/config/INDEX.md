# Config Directory

Configuration files for FluencyKaizen Video Automation.

## Contents

| File | Purpose |
|------|---------|
| [mcp.md](./mcp.md) | Model Context Protocol — Tool integration |
| [settings.md](./settings.md) | Project settings and environment configuration |

## Quick Reference

### MCP Servers

Integrations with external tools and services:

- **filesystem** — File system access
- **bash** — Shell command execution
- **typescript** — Type checking and compilation
- **remotion** — Video composition framework
- **gemini** — Google Gemini API
- **whisper** — Local speech-to-text
- **ffmpeg** — Audio/video processing

### Settings

Project-wide configuration:

- **workspace** — Directory structure
- **tools** — Required dependencies
- **apis** — External API configuration
- **typescript** — Compiler options
- **commands** — Slash command mapping
- **environment** — Variables and secrets
- **performance** — Resource limits

## Common Tasks

### Add a New API Integration

Edit `mcp.md`:
```markdown
## [your-api]

- **enabled**: true
- **description**: ...
- **capabilities**: [...]
- **config**: {...}
```

### Change Project Settings

Edit `settings.md`:
```markdown
## [section]

Key: value
```

### Update Tool Paths

Edit `settings.md` → `tools` section

### Configure Environment Variables

Edit `settings.md` → `environment` section

## See Also

- [Agents](../agents/INDEX.md) — Agent configuration
- [Skills](../skills/INDEX.md) — Command reference
- [CLAUDE.md](../CLAUDE.md) — Project overview
