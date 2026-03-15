# FluencyKaizen Video Automation

## Project Purpose

Automated short-form video production pipeline for multilingual business English content. Processes raw 10-minute bilingual videos into professionally edited 30-60s clips with synchronized bilingual captions, vocabulary highlighting, pop-up vocab cards, and persistent hook titles.

**Supported languages**: Japanese (ja), Chinese (zh), Korean (ko), Spanish (es)

---

## Architecture

```
input/[raw.mp4]
  ↓ ffmpeg extract audio
output/[name]/audio.wav
  ↓ Whisper transcribe (local, word-level timestamps)
output/[name]/audio.json
  ↓ Gemini 2.5 Flash analyze + translate (structured JSON output)
output/[name]/clip.json
  ↓ silence detection + removal (ffmpeg silencedetect + filter_complex)
output/[name]/clip_trimmed.mp4
  ↓ Remotion render (1080x1920 portrait, 30fps)
output/[name]/render.mp4
```

**Four layers**: Pipeline (Bun CLI) → Remotion (React video) → Studio (Bun HTTP server) → Electron (desktop wrapper)

---

## ClipData Schema (source of truth: `src/pipeline/types.ts`)

```typescript
type SupportedLanguage = "ja" | "zh" | "ko" | "es";

interface ClipData {
  videoFile: string;                    // source filename in input/
  videoDuration: number;                // full source video length (seconds)
  targetLanguage?: SupportedLanguage;   // default: "ja"
  socialTitle?: string;                 // social caption with emojis + hashtags
  hookTitle: {
    ja?: string;                        // backward compat
    target?: string;                    // target language title
    en: string;
    highlights?: string[];              // words to highlight yellow in target title
  };
  clip: { startTime: number; endTime: number };
  hook?: HookSegment;                   // 1-3s attention segment prepended in render
  subtitles: SubtitleSegment[];
  vocabCards: VocabCard[];
  boringCuts?: RetentionCut[];          // Gemini-proposed boring sections
  silenceGaps?: SilenceGap[];           // silence gaps removed (audit trail)
  appliedCuts?: AppliedCut[];           // all removed segments after merge
}

interface SubtitleSegment {
  startTime: number; endTime: number;
  en: string;
  ja?: string;                          // backward compat
  target?: string;                      // target language text
  highlights: string[];                 // target language highlight words
  enHighlights: string[];              // English highlight words
  emoji?: string;                       // Gemini-selected emoji
  emojiPlacement?: "en-prefix" | "en-suffix" | "target-prefix" | "target-suffix";
}

interface VocabCard {
  triggerTime: number; duration: number;
  category: string; phrase: string; literal: string; nuance: string;
}

interface HookSegment { startTime: number; endTime: number; reason?: string; }
interface RetentionCut { startTime: number; endTime: number; reason: string; confidence?: number; }
interface AppliedCut { originalStart: number; originalEnd: number; duration: number; type: "silence" | "retention"; reason?: string; }
interface SilenceGap { originalStart: number; originalEnd: number; duration: number; }
```

All timestamps are in **seconds** (float), not frames.

---

## Key Commands

```bash
/process-video <file> [--force] [--lang <ja|zh|ko|es>]   # Full pipeline
/edit-clip <name>                                          # Natural language editing
/preview <name>                                            # Remotion Studio preview
/render <name>                                             # Render to MP4
/validate-clip <name>                                      # Schema validation
/studio                                                    # Launch integrated Studio UI
/docs                                                      # View/update documentation
/agent-status                                              # List all 42 agents
/list-clips                                                # Show all clips
/setup-env                                                 # Verify dependencies
/test-pipeline                                             # Run tests
/clean-output <name>                                       # Remove temp files
/refresh                                                   # Refresh Remotion preview
```

---

## File Paths

### Pipeline (`src/pipeline/`)
| File | Purpose |
|------|---------|
| `types.ts` | ClipData schema — single source of truth |
| `config.ts` | LIMITS, getLimits(lang) — character limits per language |
| `index.ts` | CLI entrypoint — `bun src/pipeline/index.ts <video> [--force] [--lang]` |
| `transcribe.ts` | Whisper integration — ffmpeg audio extraction + local transcription |
| `analyze.ts` | Gemini 2.5 Flash — structured JSON output, 3x retry, post-processing |
| `silence.ts` | Silence detection — ffmpeg silencedetect, gap removal, timestamp remapping |
| `silence.test.ts` | Unit tests for silence detection |
| `cache.ts` | SHA-256 pipeline cache — `.pipeline-cache.json` per clip |
| `hook.ts` | Hook segment resolution — 1-3s attention opener |
| `generate-tsx.ts` | Per-clip TSX generation — copies components, rewrites imports |

### Remotion (`src/remotion/`)
| File | Purpose |
|------|---------|
| `ClipComposition.tsx` | Main render — OffthreadVideo, Sequence timing, hook duplication, sound effects |
| `Root.tsx` | Registers all compositions from clip-data-all.ts |
| `index.tsx` | Remotion entry point |
| `components/HookTitle.tsx` | Persistent title overlay with highlights, logo, branding |
| `components/BilingualCaption.tsx` | EN + target captions, emoji placement, per-language fonts |
| `components/HighlightedText.tsx` | Regex highlight — longest-match-first, yellow #FFD700 |
| `components/VocabCard.tsx` | Animated popup — interpolate fade-in/hold/fade-out |
| `clip-data-all.ts` | AUTO-GENERATED — clip imports (regenerated by watch-clip.ts) |
| `watch-clip.ts` | File watcher — monitors output/, regenerates clip-data-all.ts, symlinks |
| `prepare-render.ts` | Pre-render setup script |

### Editor (`src/remotion/editor/`)
| File | Purpose |
|------|---------|
| `App.tsx` | Editor React app — useState state, auto-save 1.5s debounce, Cmd+S |
| `EditorComposition.tsx` | ClipComposition wrapper for @remotion/player |
| `main.tsx` | Vite entry point |

### Studio (`src/studio/`)
| File | Purpose |
|------|---------|
| `server.ts` | Bun HTTP on port 3210 — clip CRUD API, WebSocket PTY, Remotion proxy |
| `project.html` | Vanilla JS card grid — import, language selector, delete, Electron-aware |
| `terminal.ts` | xterm.js — FitAddon, WebLinksAddon, WS auto-reconnect, per-clip tabs |

### Electron (`src/main/`)
| File | Purpose |
|------|---------|
| `main.cjs` | BrowserWindow, server spawn, readiness polling, IPC handlers |
| `preload.cjs` | contextBridge — window.studio.isElectron, importVideo(lang), goBack() |

### Configuration
| File | Purpose |
|------|---------|
| `style.json` | All visual config — hookTitle, caption, fontOverrides, highlight, vocabCard |
| `package.json` | Dependencies, scripts — Remotion 4.0.434, React 18, Electron 33 |

### Output
| Path | Purpose |
|------|---------|
| `input/` | Raw MP4/MOV files (MOV auto-converted) |
| `output/[name]/clip.json` | **The editable artifact** — agents modify this |
| `output/[name]/audio.wav` | Extracted audio |
| `output/[name]/audio.json` | Whisper transcript |
| `output/[name]/clip_trimmed.mp4` | Trimmed video segment |

---

## Visual System (`style.json`)

Central config for all Remotion components:
- **hookTitle**: fontSize 84, white text, gold (#FFD700) highlights, logo, branding
- **caption**: EN fontSize 62, target fontSize 48, positioned at top 1280
- **fontOverrides**: per-language font families (ja/zh/ko/es)
- **highlight**: gold (#FFD700)
- **vocabCard**: positioned at top 1440, fade-in 10f/hold 40f/fade-out 10f, dark background with gold border

---

## Multi-Language Support

```typescript
const LANGUAGE_CONFIG: Record<SupportedLanguage, LanguageConfig> = {
  ja: { name: "Japanese", nativeName: "日本語", script: "cjk", ... },
  zh: { name: "Chinese",  nativeName: "中文",   script: "cjk", ... },
  ko: { name: "Korean",   nativeName: "한국어", script: "cjk", ... },
  es: { name: "Spanish",  nativeName: "Español", script: "latin", ... },
};
```

Character limits: CJK scripts get 30 chars for hookTitle, Latin gets 50.

---

## Dependencies

- **Runtime**: Bun (server, pipeline, scripts)
- **Rendering**: Remotion 4.0.434, React 18, @remotion/player
- **Desktop**: Electron 33
- **AI**: @google/generative-ai (Gemini 2.5 Flash)
- **Terminal**: @xterm/xterm, @xterm/addon-fit, @xterm/addon-web-links
- **System tools**: ffmpeg (audio/video processing), whisper (local transcription)
- **Build**: Vite 7, TypeScript 5, concurrently

---

## Agents & Documentation

- **42 specialized agents** in `.claude/agents/` — organized by domain (Pipeline, Remotion, Editor, Studio, Electron, Cross-Cutting)
- **14 skill files** in `.claude/skills/` — domain knowledge for Remotion, React, pipeline, ffmpeg, Gemini, etc.
- **14 per-folder CLAUDE.md files** — hyperlocal context for each directory
- **6 doc files** in `docs/` — discovery, plan, PRD, problems, progress, research

See `.claude/agents/INDEX.md` for the full routing table and file ownership map.

---

## Notes

- Clip timestamps are in **seconds** (float), not frames
- Gemini model: `gemini-2.5-flash` (fast, structured JSON output)
- Whisper runs **locally** — no API calls
- Video output: 1080x1920 portrait MP4, 30fps
- Pipeline cache: SHA-256 hashing, skip unchanged steps
- HMR: watch-clip.ts monitors clip.json changes for live preview
