# Tool Research & Benchmarks

> Research notes on tools, libraries, and services evaluated or used in the FluencyKaizen pipeline. Agents should add findings here during exploration.

Last updated: 2026-03-15

---

## Transcription: OpenAI Whisper

### Selection Rationale
- Runs **locally** — no API calls, no cost per minute, no data leaving the machine.
- Provides **word-level timestamps** essential for subtitle synchronization.
- Supports multilingual transcription (English + Japanese/Chinese/Korean/Spanish mixed audio).

### Configuration
- **Model:** `turbo` (best speed/accuracy trade-off for our use case)
- **Output format:** JSON with word-level timestamps
- **Installation:** `pip install openai-whisper` (requires Python, ffmpeg)

### Performance Benchmarks
| Model | Speed (10min video) | Accuracy (bilingual) | VRAM |
|-------|---------------------|----------------------|------|
| tiny | ~15s | Low — misses Japanese | 1GB |
| base | ~30s | Moderate | 1GB |
| small | ~60s | Good | 2GB |
| medium | ~90s | Very good | 5GB |
| large-v3 | ~180s | Excellent | 10GB |
| turbo | ~45s | Very good | 6GB |

**Selected:** `turbo` — provides near-large accuracy at significantly faster speed. Handles mixed EN/JP audio well.

### Known Limitations
- Mixed-language segments sometimes get transcribed in the wrong language.
- Very quiet speech may be missed; silence detection helps compensate.
- Requires Python environment alongside Bun/Node.

---

## LLM Analysis: Google Gemini 2.5 Flash

### Selection Rationale
- **Large context window** — handles full 10-minute transcripts in a single call.
- **Structured JSON output** — native JSON mode enforces schema compliance.
- **Fast and cost-effective** — significantly cheaper than GPT-4 for equivalent quality on structured tasks.
- **Good multilingual capability** — accurate EN↔JP/ZH/KO/ES translation.

### Configuration
- **Model:** `gemini-2.5-flash`
- **Output mode:** Structured JSON (schema provided in prompt)
- **Retry strategy:** 3 attempts with exponential backoff
- **Client:** `@google/generative-ai` npm package

### Prompt Strategy
Single call with:
1. Full Whisper transcript (word-level timestamps)
2. Content format explanation (bilingual business English)
3. Clip selection criteria (best 30-60s, engaging, educational)
4. Translation requirements (clean, natural bilingual subtitles)
5. Vocab extraction rules (3-5 business phrases with nuance)
6. Hook title generation (catchy, both languages)
7. Full ClipData schema definition
8. JSON mode enforcement

### Performance
| Metric | Value |
|--------|-------|
| Latency (10min transcript) | 8-15 seconds |
| JSON validity rate | ~95% (with JSON mode) |
| Translation quality | Good for business context |
| Clip selection quality | Good — selects engaging segments |
| Cost per call | ~$0.01-0.03 |

### Migration Notes
- Previously used `gemini-2.0-flash` (deprecated).
- Migration to 2.5 required no prompt changes; output quality improved.
- Some old CLAUDE.md files still reference 2.0 (see problem.md).

---

## Video Rendering: Remotion 4.0.434

### Selection Rationale
- **React component model** — familiar paradigm for building layered video compositions.
- **Frame-accurate rendering** — deterministic output, every frame computed.
- **Interactive Studio** — preview and debug compositions in the browser.
- **Programmatic API** — render from code, integrate with pipeline.

### Key APIs Used

| API | Purpose |
|-----|---------|
| `OffthreadVideo` | Load and display source video without blocking render thread |
| `Sequence` | Time-bound composition segments (subtitles, vocab cards) |
| `interpolate` | Smooth animations (fade, slide, scale) |
| `useCurrentFrame` | Frame-aware component logic |
| `useVideoConfig` | Access composition dimensions, fps, duration |
| `spring` | Physics-based animations for card pop-ups |

### Performance
| Metric | Value |
|--------|-------|
| Render time (30s clip) | 60-90 seconds |
| Render time (60s clip) | 120-180 seconds |
| Studio startup | 3-5 seconds |
| Memory usage (render) | 1-2 GB |

### Configuration
- **Resolution:** 1080x1920 (portrait)
- **FPS:** 30
- **Codec:** H.264 (MP4)
- **Concurrency:** Default (auto-detected)

### Known Considerations
- `OffthreadVideo` is required for large source files; regular `Video` component can cause memory issues.
- Root.tsx requires a `require()` hack for dynamic clip data loading (see problem.md).
- Remotion 4.x changed some APIs from 3.x; pinned to 4.0.434 for stability.

---

## Server: Bun HTTP Server

### Selection Rationale
- **Native WebSocket support** — built into Bun's HTTP server, no additional packages.
- **Fast startup** — server ready in <500ms.
- **TypeScript native** — no compilation step needed.
- **File serving** — built-in static file handling.

### Configuration
- **Port:** 3210
- **Features used:** HTTP routes, WebSocket upgrade, static file serving
- **PTY bridge:** WebSocket connects xterm.js in browser to server-side terminal via `terminal.ts`

### Performance
| Metric | Value |
|--------|-------|
| Server startup | ~200ms |
| HTTP response (static) | <5ms |
| WebSocket latency | <10ms |
| Memory footprint | ~30MB |

---

## Desktop: Electron 33

### Selection Rationale
- Mature framework for wrapping web apps as desktop applications.
- Native file system access for video I/O.
- Cross-platform (macOS, Windows, Linux).
- Large ecosystem for packaging and auto-updates.

### Configuration
- **Entry:** `src/main/main.cjs` (CommonJS required by Electron)
- **Preload:** `src/main/preload.cjs` (secure IPC bridge)
- **Target:** Desktop (macOS primary)

### Considerations
- Electron adds ~150MB to distribution size.
- CommonJS entry points are inconsistent with the rest of the ESM codebase.
- Packaging not yet configured (planned for Phase 7).

---

## Tools Evaluated but Not Selected

### Deno (Runtime)
- Considered as alternative to Bun.
- Rejected: Less mature npm compatibility at evaluation time. Bun's speed advantage was significant.

### FFmpeg.wasm (Audio Extraction)
- Considered for in-browser audio extraction.
- Rejected: Slower than system ffmpeg. Desktop app has system access, so native ffmpeg is preferred.

### Deepgram (Transcription)
- Considered as cloud alternative to Whisper.
- Rejected: Adds API cost and data transfer. Whisper local is free and fast enough. Privacy advantage of local processing.

### OpenAI GPT-4 (Analysis)
- Considered for transcript analysis.
- Rejected: Higher cost per call, slower for structured output. Gemini 2.5 Flash's JSON mode and speed are better suited.
