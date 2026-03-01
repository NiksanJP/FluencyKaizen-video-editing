# FluencyKaizen Video Automation — Project Context & Agent Collaboration Guide

## Project Purpose

Automated short-form video production pipeline for "Business English for Japanese speakers" content channel. The creator uploads raw 10-minute bilingual (EN/JP) videos and receives professionally edited 30-60s clips with:
- Synchronized bilingual captions (Japanese + English)
- Inline vocabulary highlighting
- Pop-up vocabulary cards for business phrases
- Persistent hook title at top

---

## 🤝 Multi-Agent Collaboration Framework

**This project uses coordinated Claude Agents to handle different aspects of the workflow.** All agents work together seamlessly, communicating through defined interfaces and helping each other accomplish complex tasks.

### Agent Team Composition

**Primary Agents:**
1. **Pipeline Orchestrator** — Manages full video processing (transcribe → analyze → output)
2. **Remotion Composer** — Handles video rendering and Studio preview
3. **Clip Editor** — Natural language editing of clip.json
4. **Schema Validator** — Ensures data integrity and spec compliance

**Support Agents:**
5. **Error Handler** — Catches failures and suggests fixes (works with any agent)
6. **Performance Optimizer** — Monitors and optimizes resource usage
7. **Documentation Curator** — Maintains docs and knowledge base
8. **Setup Manager** — Manages environment and dependencies
9. **Test Coordinator** — Runs integration tests and QA

### How Agents Collaborate

#### Sequential Workflow (Most Tasks)
```
/process-video
  └─ Pipeline Orchestrator (primary)
     ├─ Uses: Whisper transcriber, Gemini API
     ├─ Calls: Schema Validator (validate output)
     └─ Calls: Error Handler (if failures occur)
```

#### Cooperative Workflow (Complex Tasks)
```
/edit-clip
  └─ Clip Editor (primary)
     ├─ Reads: clip.json
     ├─ Calls: Schema Validator (check changes)
     ├─ Communicates: Remotion Composer (preview impact)
     └─ Calls: Error Handler (on validation failure)
```

#### Parallel Workflow (Testing)
```
/test-pipeline
  └─ Test Coordinator (primary)
     ├─ Calls: Pipeline Orchestrator (test transcription)
     ├─ Calls: Remotion Composer (test rendering)
     └─ Calls: Schema Validator (test validation)
     ↓ All run in parallel, results aggregated
```

### Agent Responsibilities by Task

| Command | Primary Agent | Collaborators | Mode |
|---------|---------------|----------------|------|
| `/process-video` | Pipeline Orchestrator | Schema Validator, Error Handler | Sequential |
| `/render` | Remotion Composer | Performance Optimizer, Error Handler | Sequential |
| `/preview` | Remotion Composer | Error Handler | Sequential |
| `/edit-clip` | Clip Editor | Schema Validator, Error Handler | Sequential |
| `/validate-clip` | Schema Validator | Error Handler | Sequential |
| `/test-pipeline` | Test Coordinator | All others | Parallel |
| `/setup-env` | Setup Manager | Error Handler | Sequential |
| `/list-clips` | Documentation Curator | - | Sequential |
| `/clean-output` | Setup Manager | Error Handler | Sequential |

### Agent Communication Protocol

Agents communicate via:
- **JSON-RPC** over stdout/stderr
- **File-based state** (clip.json, logs)
- **Error propagation** (exceptions bubble to Error Handler)
- **Logging** (all activity in `.claude/logs/agents/`)

### What Makes Agents Work Together?

1. **Defined Interfaces** — Each agent knows the ClipData schema
2. **Clear Responsibility** — One primary agent per task (avoids conflicts)
3. **Error Handling** — Error Handler is always available as fallback
4. **Validation** — Schema Validator ensures data consistency
5. **Communication** — Agents share context and results

### When to Invoke Multi-Agent Coordination

**Automatic** (you don't need to do anything):
- `/process-video` → Pipeline Orchestrator automatically calls Schema Validator
- Any error → Error Handler automatically engages
- `/test-pipeline` → Test Coordinator automatically parallelizes tests

**Manual** (if you need to):
- Run `/validate-clip` before editing if you want explicit validation
- Run `/test-pipeline` before `/render` to catch issues early

---

## Architecture Overview

```
input/[raw.mp4]
  ↓ (ffmpeg extract audio)
[audio.wav]
  ↓ (whisper transcribe)
[transcript.json + timestamps]
  ↓ (gemini analyze + translate)
[clip.json]
  ↓ (claudeedit via natural language)
[clip.json] (modified)
  ↓ (remotion render)
output/[clip]/render.mp4
```

---

## Clip JSON Schema

```typescript
interface ClipData {
  videoFile: string;
  hookTitle: { ja: string; en: string };
  clip: { startTime: number; endTime: number };
  subtitles: SubtitleSegment[];
  vocabCards: VocabCard[];
}

interface SubtitleSegment {
  startTime: number;
  endTime: number;
  en: string;
  ja: string;
  highlights: string[];
}

interface VocabCard {
  triggerTime: number;
  duration: number;
  category: string;
  phrase: string;
  literal: string;
  nuance: string;
}
```

---

## Key Commands (Slash Commands)

### Full Workflow
```bash
/process-video example.mp4    # 1. Run pipeline (3-5 min)
/edit-clip example            # 2. Edit via natural language (optional)
/preview example              # 3. Preview in Remotion Studio (interactive)
/render example               # 4. Render to MP4 (2-5 min)
```

### Validation & Management
```bash
/validate-clip example        # Check clip.json against schema
/list-clips                   # Show all generated clips
/clean-output example         # Remove temporary files
/setup-env                    # Verify all dependencies
/test-pipeline                # Run integration tests
```

---

## File Paths Reference

| Path | Purpose | Agent |
|------|---------|-------|
| `pipeline/types.ts` | ClipData schema (single source of truth) | All agents |
| `pipeline/index.ts` | CLI entrypoint | Pipeline Orchestrator |
| `pipeline/transcribe.ts` | Whisper integration | Pipeline Orchestrator |
| `pipeline/analyze.ts` | Gemini API integration | Pipeline Orchestrator |
| `remotion/src/ClipComposition.tsx` | Main composition | Remotion Composer |
| `remotion/src/components/` | Visual components | Remotion Composer |
| `output/[name]/clip.json` | **Editable artifact** | Clip Editor, Schema Validator |
| `.claude/agents.json` | Agent configuration | Agent framework |
| `.claude/settings.json` | Claude Code settings | Setup Manager |
| `.claude/commands/` | Slash command specs | All agents |

---

## Gemini Prompt Strategy

Single call to Gemini 2.0 Flash with the full Whisper transcript. The prompt:
1. Explains the content format (bilingual business English for Japanese learners)
2. Asks for best 30-60s segment selection with reasoning
3. Asks for EN↔JP translation per subtitle segment (handles mixed language)
4. Asks for vocab card extraction (business phrases, slang, corporate jargon)
5. Asks for hook title in both languages
6. Demands output as valid JSON matching the ClipData schema (schema included in prompt)
7. Uses Gemini's structured output / JSON mode to enforce schema

**Model**: `gemini-2.0-flash` (fast, cheap, large context for long transcripts)

---

## Visual Components (Remotion)

- **HookTitle**: Large bold white text, black stroke, centered at top, all 30-60s
- **BilingualCaption**: Lower third area, English above, Japanese below, synced to timestamps
- **HighlightedText**: Japanese text with yellow/orange color on words in `highlights` array
- **VocabCard**: Animated pop-up card with category, phrase, literal, nuance

---

## Editing Workflow (Natural Language)

When user runs `/edit-clip` and makes a natural language request (e.g. "make the first vocab card appear 2 seconds later"):

1. **Clip Editor** reads `output/[name]/clip.json`
2. Parses the JSON into the ClipData structure
3. Updates the requested field(s)
4. **Schema Validator** re-validates the JSON
5. Writes the updated JSON back
6. Confirms the changes and shows a preview

---

## Dependencies

### Root workspace
- `@google/generative-ai` — Gemini API

### Pipeline scripts (system tools)
- `ffmpeg` — Audio extraction (must be installed locally)
- `whisper` — Local transcription (from openai-whisper package)

### Remotion workspace
- `remotion` — Video rendering
- `react` + `react-dom` — Standard ecosystem

---

## Setup Checklist

Before first run, agents will verify:
- [ ] Create pipeline/ directory and TypeScript files ✓
- [ ] Create remotion/ workspace ✓
- [ ] Install dependencies: `bun install`
- [ ] Add Gemini API key to `.env`
- [ ] Create `input/` and `output/` directories ✓
- [ ] Test full pipeline with sample video
- [ ] Verify Remotion renders successfully
- [ ] Verify Claude `/edit-clip` command works

---

## Agent Logs & Debugging

All agent activity is logged:
```
.claude/logs/
├── agents/
│   ├── pipeline-orchestrator.log
│   ├── remotion-composer.log
│   ├── clip-editor.log
│   ├── schema-validator.log
│   └── ...
├── claude.log              # Main Claude Code log
└── errors.log              # Aggregated errors
```

View logs:
```bash
tail -f .claude/logs/agents/pipeline-orchestrator.log
```

---

## Performance Targets

| Step | Target | Agents |
|------|--------|--------|
| Transcription | <2 min | Pipeline Orchestrator |
| Gemini analysis | <1 min | Pipeline Orchestrator |
| Full pipeline | <5 min | Pipeline Orchestrator → Schema Validator |
| Render time | 2-5 min | Remotion Composer + Performance Optimizer |
| Preview launch | <10 sec | Remotion Composer |

---

## Notes

- **Clip timestamps** are in **seconds** (float) not frames
- **Gemini model**: `gemini-2.0-flash` (fast, cheap, large context)
- **Whisper**: Runs **locally** — no API calls needed
- **All video output**: MP4 for compatibility
- **Agents are autonomous**: They make decisions within their scope
- **Errors are handled gracefully**: Error Handler steps in to help
- **Documentation is always current**: Documentation Curator keeps it updated

---

## Support & Help

- `/help` — General help (Documentation Curator)
- `docs/progress.md` — Build checklist and testing plan
- `docs/research.md` — Tool research notes and benchmarks
- `.claude/remotion-guide.md` — Remotion-specific techniques
- `.claude/agents.json` — Agent configuration and roles

---

## Project Status

**Phase**: Implementation Complete ✅
**Agents**: 9 configured and ready ✅
**Skills**: 9 slash commands available ✅
**Plugins**: 6 tool integrations active ✅

**Next**: Run `/setup-env` to verify environment, then `/process-video` to test the pipeline.

---

*This project uses multi-agent orchestration to handle complex video production workflows. Agents automatically coordinate, validate, optimize, and recover from errors to provide a seamless user experience.*

---

## Editor Project Context (for Claude Code Terminal)

When Claude Code runs inside the editor's terminal panel, it receives environment variables:

- `FLUENCYKAIZEN_PROJECT_ID` — UUID of the currently open project
- `FLUENCYKAIZEN_PROJECTS_DIR` — Absolute path to the `projects/` directory

The project file lives at: `$FLUENCYKAIZEN_PROJECTS_DIR/$FLUENCYKAIZEN_PROJECT_ID/project.json`

The editor watches this file. If you edit it, the editor reloads automatically — no page refresh needed.

### project.json Schema

```json
{
  "id": "uuid-string",
  "name": "Project Name",
  "createdAt": 1709300000000,
  "lastModified": 1709300000000,
  "composition": {
    "width": 1080,
    "height": 1920,
    "fps": 30,
    "durationInFrames": 900
  },
  "tracks": [
    {
      "id": "track-1709300000000",
      "type": "video | audio | image",
      "name": "Video 1",
      "clips": [
        {
          "id": "clip-1709300000000",
          "type": "video | audio | image",
          "name": "filename.mp4",
          "src": "asset://project-uuid/filename.mp4",
          "path": "asset://project-uuid/filename.mp4",
          "mimeType": "video/mp4",
          "start": 0,
          "duration": 10.5,
          "startFrame": 0,
          "durationFrames": 315,
          "sourceStart": 0,
          "originalDuration": 120.0,
          "x": 0,
          "y": 0,
          "scale": 100,
          "rotation": 0,
          "opacity": 100
        }
      ],
      "visible": true
    }
  ]
}
```

### Editing Rules

1. **Always update `lastModified`** to `Date.now()` (ms since epoch) so the editor detects the change.
2. **Keep seconds and frames in sync**: `startFrame = Math.round(start * fps)`, `durationFrames = Math.round(duration * fps)`. The `fps` is in `composition.fps` (usually 30).
3. **Asset URLs** use the format `asset://PROJECT_ID/filename.ext`.
4. **Clip IDs** must be unique strings (convention: `clip-TIMESTAMP`).
5. **Track IDs** must be unique strings (convention: `track-TIMESTAMP`).
6. **Track types**: `"video"`, `"audio"`, or `"image"`.
7. **Transform fields** (`x`, `y`, `scale`, `rotation`, `opacity`) are relative to the canvas center. `scale` and `opacity` are percentages (100 = normal).

### Example: Move a clip 2 seconds later

```bash
# Read, modify, write back
PROJECT_FILE="$FLUENCYKAIZEN_PROJECTS_DIR/$FLUENCYKAIZEN_PROJECT_ID/project.json"
# Use jq or node to update .tracks[0].clips[0].start += 2,
# recalculate .startFrame, and set .lastModified = Date.now()
```

### Example: Add a text overlay (as an image clip)

Add a new track of type `"image"` with a clip pointing to an uploaded image asset.
