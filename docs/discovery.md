# Architecture Discovery & Decisions

> Living document tracking architectural decisions, data flow findings, and design rationale for the FluencyKaizen video editing pipeline.

Last updated: 2026-03-15

---

## System Architecture

### High-Level Data Flow

```
input/[raw.mp4]
  |
  v
Pipeline (src/pipeline/)
  ├── ffmpeg: extract audio → audio.wav
  ├── Whisper: transcribe → transcript with word-level timestamps
  ├── silence.ts: detect silence gaps in audio
  ├── Gemini 2.5 Flash: analyze → structured ClipData JSON
  ├── hook.ts: extract hook segment metadata
  └── generate-tsx.ts: optional TSX generation
  |
  v
output/[clip]/clip.json (ClipData schema)
  |
  v
Remotion (src/remotion/)
  ├── ClipComposition.tsx: main composition (1080x1920, 30fps)
  ├── Components: HookTitle, BilingualCaption, HighlightedText, VocabCard
  ├── Editor: App.tsx with clip-data system, watch-clip.ts for live reload
  └── style.json: centralized visual configuration
  |
  v
Studio (src/studio/)
  ├── server.ts: Bun HTTP server on port 3210
  ├── project.html: card grid UI for project management
  └── terminal.ts: WebSocket PTY bridge with xterm.js
  |
  v
Electron (src/main/)
  ├── main.cjs: Electron main process
  └── preload.cjs: preload script for IPC bridge
```

### Key Architecture Decisions

#### ADR-001: Bun as Runtime
- **Decision:** Use Bun instead of Node.js for all server-side code.
- **Rationale:** Faster startup, built-in TypeScript support, native WebSocket support in HTTP server, compatible with the npm ecosystem.
- **Trade-offs:** Smaller ecosystem for edge cases; some Node.js APIs behave differently.

#### ADR-002: Single Gemini Call for Analysis
- **Decision:** Send the full Whisper transcript in a single Gemini 2.5 Flash request.
- **Rationale:** Reduces latency vs. multiple calls. Gemini 2.5 Flash handles large context windows efficiently. Structured JSON output mode enforces schema compliance.
- **Trade-offs:** Single point of failure per analysis; mitigated by 3x retry logic.

#### ADR-003: ClipData as Central Artifact
- **Decision:** All pipeline output flows through a single `clip.json` file conforming to the ClipData schema.
- **Rationale:** Single source of truth for rendering, editing, and preview. Enables natural-language editing via Claude agents. Human-readable and diffable.

#### ADR-004: Remotion for Video Rendering
- **Decision:** Use Remotion (React-based video framework) for all video output.
- **Rationale:** React component model maps naturally to layered video composition. OffthreadVideo handles large source files. Sequence/interpolate provide frame-accurate animation. Studio mode enables interactive preview.

#### ADR-005: Portrait-First Video Format
- **Decision:** All output is 1080x1920 portrait at 30fps.
- **Rationale:** Optimized for short-form platforms (TikTok, Instagram Reels, YouTube Shorts).

#### ADR-006: style.json for Visual Configuration
- **Decision:** Centralize all visual styling (colors, fonts, sizes, positions) in a `style.json` file rather than hardcoding in components.
- **Rationale:** Enables non-developer customization. Supports brand consistency across clips. Allows A/B testing of visual styles.

#### ADR-007: Multi-Language Support via targetLanguage
- **Decision:** Support `ja`, `zh`, `ko`, `es` as target languages via a `SupportedLanguage` type in the schema.
- **Rationale:** Content channel expanding beyond Japanese to Chinese, Korean, and Spanish audiences. Schema-level support ensures all pipeline stages handle language correctly.

#### ADR-008: Electron Wrapper for Desktop
- **Decision:** Wrap the Studio web UI in Electron for desktop distribution.
- **Rationale:** Provides native file system access, system tray integration, and a familiar desktop app experience. Uses preload.cjs for secure IPC.

---

## Data Flow Details

### Pipeline Stage Outputs

| Stage | Input | Output | Key Files |
|-------|-------|--------|-----------|
| Audio extraction | raw.mp4 | audio.wav | index.ts |
| Transcription | audio.wav | transcript JSON | transcribe.ts |
| Silence detection | audio.wav | silence gaps array | silence.ts |
| Analysis | transcript + silence | clip.json | analyze.ts |
| Hook extraction | transcript | hook segment data | hook.ts |
| Caching | all intermediates | cached results | cache.ts |

### ClipData Schema Fields

```typescript
interface ClipData {
  videoFile: string;
  videoDuration: number;
  targetLanguage: SupportedLanguage;  // "ja" | "zh" | "ko" | "es"
  socialTitle: string;
  hookTitle: { ja: string; en: string };
  clip: { startTime: number; endTime: number };
  hook: { startTime: number; endTime: number };
  subtitles: SubtitleSegment[];
  vocabCards: VocabCard[];
  boringCuts: Cut[];
  silenceGaps: SilenceGap[];
  appliedCuts: Cut[];
}
```

### Studio Communication

- **HTTP:** Bun server on port 3210 serves project.html and static assets.
- **WebSocket:** PTY bridge in terminal.ts connects xterm.js in the browser to server-side terminal sessions.
- **File Watching:** watch-clip.ts monitors clip.json for changes and triggers live reload in the Remotion editor.

---

## Open Questions

- [ ] Should we support batch processing of multiple clips from a single video?
- [ ] Is there value in a cloud-hosted rendering option for users without local GPU?
- [ ] Should style.json support per-language visual overrides?
