# Agent Directory — 42 Specialized Agents

## Pipeline Domain (8 agents)

| Agent | Owned Files | Key Responsibility |
|-------|-------------|-------------------|
| [whisper-transcription](./whisper-transcription.md) | `src/pipeline/transcribe.ts` | Whisper CLI, ffmpeg audio extraction |
| [gemini-analysis](./gemini-analysis.md) | `src/pipeline/analyze.ts` | Gemini 2.5 Flash, structured output, validation |
| [silence-detection](./silence-detection.md) | `src/pipeline/silence.ts`, `silence.test.ts` | Silence gaps, timestamp remapping |
| [pipeline-cache](./pipeline-cache.md) | `src/pipeline/cache.ts` | SHA-256 caching, skip unchanged steps |
| [hook-resolution](./hook-resolution.md) | `src/pipeline/hook.ts` | 1-3s hook segment selection |
| [tsx-generator](./tsx-generator.md) | `src/pipeline/generate-tsx.ts` | Per-clip TSX generation |
| [pipeline-orchestrator](./pipeline-orchestrator.md) | `src/pipeline/index.ts` | CLI entrypoint, step sequencing |
| [clipdata-schema](./clipdata-schema.md) | `src/pipeline/types.ts`, `config.ts` | Schema definitions, language config |

## Remotion Domain (7 agents)

| Agent | Owned Files | Key Responsibility |
|-------|-------------|-------------------|
| [composition-renderer](./composition-renderer.md) | `ClipComposition.tsx`, `Root.tsx`, `index.tsx` | Main render, Sequence timing, hook duplication |
| [hook-title-component](./hook-title-component.md) | `components/HookTitle.tsx` | Persistent title overlay, highlights, branding |
| [bilingual-caption](./bilingual-caption.md) | `components/BilingualCaption.tsx`, `HighlightedText.tsx` | EN+target captions, emoji, highlight regex |
| [vocab-card-component](./vocab-card-component.md) | `components/VocabCard.tsx` | Animated popup, interpolate fade timing |
| [clip-data-loader](./clip-data-loader.md) | `clip-data*.ts`, `watch-clip.ts`, `preview-all.ts` | Auto-generated imports, symlinks, HMR |
| [remotion-config](./remotion-config.md) | `remotion.config.ts`, `prepare-render.ts` | Public dir, bundle cache, pre-render |
| [style-system](./style-system.md) | `style.json` | Visual config for all components |

## Editor UI Domain (7 agents)

| Agent | Owned Files | Key Responsibility |
|-------|-------------|-------------------|
| [editor-app](./editor-app.md) | `editor/App.tsx` | State management, auto-save, Cmd+S |
| [timeline-component](./timeline-component.md) | Timeline UI in App.tsx | Visual timeline, playhead, track rows |
| [edit-panel](./edit-panel.md) | Edit panel in App.tsx | Subtitle/vocab editing forms |
| [player-panel](./player-panel.md) | `editor/EditorComposition.tsx` | @remotion/player wrapper, frame sync |
| [toolbar-component](./toolbar-component.md) | Toolbar in App.tsx | Clip selector, save button, status |
| [timeline-state](./timeline-state.md) | Future timeline/store.tsx | useReducer store, TimelineState |
| [timeline-adapter](./timeline-adapter.md) | Future timeline/adapter.ts | ClipData → TimelineProject tracks |

## Studio/Server Domain (4 agents)

| Agent | Owned Files | Key Responsibility |
|-------|-------------|-------------------|
| [studio-server](./studio-server.md) | `src/studio/server.ts`, `index.ts`, `launch.ts` | HTTP routes, WS PTY, pipeline spawn |
| [project-picker](./project-picker.md) | `src/studio/project.html`, `styles.css` | Card grid UI, import, language selector |
| [terminal-integration](./terminal-integration.md) | `src/studio/terminal.ts`, `pty-bridge.py` | xterm.js, WS auto-reconnect |
| [remotion-studio-proxy](./remotion-studio-proxy.md) | Proxy in `server.ts`, `remotion-studio.ts` | /_studio/* → Remotion port 3000 |

## Electron Domain (2 agents)

| Agent | Owned Files | Key Responsibility |
|-------|-------------|-------------------|
| [electron-main](./electron-main.md) | `src/main/main.cjs` | BrowserWindow, server spawn, IPC |
| [electron-preload](./electron-preload.md) | `src/main/preload.cjs` | contextBridge API, importVideo, goBack |

## Cross-Cutting Domain (14 agents)

| Agent | Scope | Key Responsibility |
|-------|-------|-------------------|
| [typescript-config](./typescript-config.md) | All tsconfig*.json | Compiler options, multi-target configs |
| [build-system](./build-system.md) | Vite configs, scripts | Build commands, dev commands, bundling |
| [dependency-manager](./dependency-manager.md) | package.json, bun.lock | Dependencies, versions, workspace |
| [testing](./testing.md) | *.test.ts files | Bun test runner, test patterns |
| [i18n-language](./i18n-language.md) | Language code across codebase | LANGUAGE_CONFIG, getLimits(), fonts |
| [audio-video-asset](./audio-video-asset.md) | ffmpeg operations | Audio extraction, MOV→MP4, concat |
| [websocket-communication](./websocket-communication.md) | WS in server.ts + terminal.ts | PTY bridge, binary messages, resize |
| [hmr-live-reload](./hmr-live-reload.md) | watch-clip.ts, file watching | clip.json detection, symlink mgmt |
| [error-recovery](./error-recovery.md) | Retry/fallback logic | Gemini retry, WS reconnect, cache recovery |
| [api-integration](./api-integration.md) | Gemini + Whisper | API setup, structured output, key mgmt |
| [performance-caching](./performance-caching.md) | cache.ts, debouncing | Pipeline cache, auto-save timing |
| [file-system](./file-system.md) | input/output, symlinks | resolveInput(), dir structure, discovery |
| [css-styling](./css-styling.md) | Inline styles, CSS | Dark theme, style.json, color palette |
| [accessibility](./accessibility.md) | Keyboard shortcuts | Cmd+S, future a11y improvements |

---

## File Ownership Map

Every source file maps to exactly one agent:

```
src/pipeline/
  types.ts, config.ts        → clipdata-schema
  index.ts                   → pipeline-orchestrator
  transcribe.ts              → whisper-transcription
  analyze.ts                 → gemini-analysis
  silence.ts, silence.test.ts → silence-detection
  cache.ts                   → pipeline-cache
  hook.ts                    → hook-resolution
  generate-tsx.ts            → tsx-generator

src/remotion/
  ClipComposition.tsx, Root.tsx, index.tsx → composition-renderer
  components/HookTitle.tsx               → hook-title-component
  components/BilingualCaption.tsx         → bilingual-caption
  components/HighlightedText.tsx         → bilingual-caption
  components/VocabCard.tsx               → vocab-card-component
  clip-data*.ts, watch-clip.ts           → clip-data-loader
  remotion.config.ts, prepare-render.ts  → remotion-config
  editor/App.tsx                         → editor-app
  editor/EditorComposition.tsx           → player-panel

src/studio/
  server.ts, index.ts, launch.ts → studio-server
  project.html, styles.css      → project-picker
  terminal.ts, pty-bridge.py    → terminal-integration
  remotion-studio.ts            → remotion-studio-proxy

src/main/
  main.cjs    → electron-main
  preload.cjs → electron-preload

style.json    → style-system
package.json  → dependency-manager
tsconfig*.json → typescript-config
```

## Task Routing

| Command | Primary Agent | Collaborators |
|---------|---------------|---------------|
| `/process-video` | pipeline-orchestrator | All pipeline agents |
| `/render` | composition-renderer | remotion-config, style-system |
| `/edit-clip` | editor-app | clipdata-schema |
| `/preview` | composition-renderer | clip-data-loader |
| `/validate-clip` | clipdata-schema | error-recovery |
| `/studio` | studio-server | project-picker, terminal-integration |
| `/docs` | — | All agents update docs |
| `/agent-status` | — | Lists all agents |
| `/list-clips` | file-system | — |
| `/setup-env` | dependency-manager | build-system |
| `/test-pipeline` | testing | All agents |
| `/clean-output` | file-system | — |
| `/refresh` | clip-data-loader | hmr-live-reload |
