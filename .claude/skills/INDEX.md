# Skills Directory — 14 Domain Skills

## Quick Reference

| Skill | Domain | Key Files |
|-------|--------|-----------|
| [remotion](./remotion.md) | Remotion 4.0.434 rendering, compositions, animations | `src/remotion/**` |
| [react-components](./react-components.md) | React 18 hooks, functional components | All `.tsx` files |
| [pipeline](./pipeline.md) | Video processing pipeline | `src/pipeline/**` |
| [studio-server](./studio-server.md) | Bun HTTP server, WebSocket, API routes | `src/studio/**` |
| [editor](./editor.md) | Clip editing UI, @remotion/player | `src/remotion/editor/**` |
| [electron](./electron.md) | Electron 33 wrapper, IPC | `src/main/**` |
| [ffmpeg](./ffmpeg.md) | Audio/video processing commands | Pipeline + silence removal |
| [gemini-api](./gemini-api.md) | Gemini 2.5 Flash, structured output | `src/pipeline/analyze.ts` |
| [whisper](./whisper.md) | Local Whisper CLI, word timestamps | `src/pipeline/transcribe.ts` |
| [typescript](./typescript.md) | TS 5 + Bun, ESNext modules | All `tsconfig` files |
| [testing](./testing.md) | Bun test runner, unit tests | `*.test.ts` files |
| [styling](./styling.md) | style.json system, dark theme | `style.json`, components |
| [i18n](./i18n.md) | Multi-language support (ja/zh/ko/es) | `types.ts`, `config.ts` |
| [deployment](./deployment.md) | Build targets, packaging | `package.json` scripts |

## Categories

### Video Production
- `remotion` — Rendering engine and composition system
- `ffmpeg` — Audio/video processing CLI
- `whisper` — Speech-to-text transcription
- `gemini-api` — AI analysis and translation

### Application
- `react-components` — UI component patterns
- `pipeline` — End-to-end video processing
- `studio-server` — Backend server and API
- `editor` — Clip editing interface
- `electron` — Desktop application wrapper

### Infrastructure
- `typescript` — Type system and compilation
- `testing` — Test runner and patterns
- `styling` — Visual design system
- `i18n` — Internationalization
- `deployment` — Build and packaging

## Plugins

| Plugin | Description |
|--------|-------------|
| Remotion Studio | `remotion studio`, `remotion render` |
| Bun Runtime | `bun run`, `bun install`, `bun test` |
| Gemini API | `@google/generative-ai` |
| FFmpeg | `ffmpeg`, `ffprobe` |
| Whisper | `whisper` (local CLI) |
| TypeScript | `tsc`, `tsc --watch` |

## See Also

- [Agents](../agents/INDEX.md) — 42 specialized agents
- [Commands](../commands/) — Slash command definitions
- [CLAUDE.md](../CLAUDE.md) — Project overview
