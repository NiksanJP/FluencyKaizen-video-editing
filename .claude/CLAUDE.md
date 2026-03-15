# FluencyKaizen Video Automation — Project Context

## Project Purpose

Automated short-form video production pipeline for multilingual business English content. Processes raw videos into 30-60s clips with bilingual captions, vocabulary highlighting, pop-up vocab cards, and hook titles.

**Supported languages**: Japanese (ja), Chinese (zh), Korean (ko), Spanish (es)

## Architecture

```
input/[raw.mp4]
  ↓ ffmpeg extract audio → output/[name]/audio.wav
  ↓ Whisper transcribe   → output/[name]/audio.json
  ↓ Gemini 2.5 Flash     → output/[name]/clip.json
  ↓ silence removal       → output/[name]/clip_trimmed.mp4
  ↓ Remotion render       → output/[name]/render.mp4
```

**Four layers**: Pipeline (Bun CLI) → Remotion (React video) → Studio (Bun HTTP, port 3210) → Electron (desktop)

## ClipData Schema (source: `src/pipeline/types.ts`)

```typescript
interface ClipData {
  videoFile: string; videoDuration: number;
  targetLanguage?: SupportedLanguage; // "ja" | "zh" | "ko" | "es"
  socialTitle?: string;
  hookTitle: { ja?: string; target?: string; en: string; highlights?: string[] };
  clip: { startTime: number; endTime: number };
  hook?: HookSegment;
  subtitles: SubtitleSegment[];
  vocabCards: VocabCard[];
  boringCuts?: RetentionCut[];
  silenceGaps?: SilenceGap[];
  appliedCuts?: AppliedCut[];
}
```

SubtitleSegment includes: en, ja?, target?, highlights, enHighlights, emoji?, emojiPlacement?
VocabCard includes: triggerTime, duration, category, phrase, literal, nuance

All timestamps in **seconds** (float).

## Key Paths

| Path | Purpose |
|------|---------|
| `src/pipeline/types.ts` | Schema source of truth |
| `src/pipeline/index.ts` | CLI: `bun src/pipeline/index.ts <video> [--force] [--lang]` |
| `src/pipeline/analyze.ts` | Gemini 2.5 Flash — structured JSON, 3x retry |
| `src/remotion/ClipComposition.tsx` | Main render composition |
| `src/remotion/components/` | HookTitle, BilingualCaption, HighlightedText, VocabCard |
| `src/remotion/editor/App.tsx` | Editor UI — auto-save, Cmd+S |
| `src/studio/server.ts` | Bun HTTP server, WebSocket PTY, Remotion proxy |
| `src/main/main.cjs` | Electron main process |
| `style.json` | All visual config |
| `output/[name]/clip.json` | Editable artifact |

## Commands

```bash
/process-video <file>    # Full pipeline
/edit-clip <name>        # Natural language editing
/preview <name>          # Remotion Studio
/render <name>           # Render MP4
/studio                  # Launch Studio UI
/docs                    # View documentation
/agent-status            # List 42 agents
```

## Dependencies

Remotion 4.0.434, React 18, Electron 33, @google/generative-ai, @xterm/xterm, Bun runtime, ffmpeg, whisper (local)

## Project Organization

- **42 agents** in `.claude/agents/` (Pipeline 8, Remotion 7, Editor 7, Studio 4, Electron 2, Cross-Cutting 14)
- **14 skills** in `.claude/skills/`
- **14 per-folder CLAUDE.md files** for hyperlocal context
- **6 docs** in `docs/` (discovery, plan, PRD, problems, progress, research)
