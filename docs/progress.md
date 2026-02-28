# Build Progress Tracker

## Phase 1: Project Setup ✅

- [x] Create `package.json` (Bun workspace root)
- [x] Create `.env.example` with Gemini API key placeholder
- [x] Create `CLAUDE.md` project context document
- [x] Create `tsconfig.json` for root pipeline
- [x] Create `input/`, `output/`, and `remotion/public/` directories
- [x] Fill documentation files:
  - [x] `docs/problem.md` — Problem statement & goals
  - [x] `docs/discovery.md` — Reference format analysis (5 components)
  - [x] `docs/prd.md` — Full product requirements
  - [x] `docs/plan.md` — Technical implementation plan
  - [x] `docs/research.md` — Tool research & benchmarks

---

## Phase 2: Pipeline Module 🚀 (In Progress)

- [x] Create `pipeline/types.ts` — ClipData, SubtitleSegment, VocabCard interfaces
- [x] Create `pipeline/transcribe.ts` — FFmpeg + Whisper integration
- [x] Create `pipeline/analyze.ts` — Gemini API integration with schema validation
- [x] Create `pipeline/index.ts` — CLI entrypoint
- [ ] Test pipeline with sample video (5-10 min)
- [ ] Verify `output/[name]/clip.json` is valid JSON
- [ ] Verify clip duration is 30-60 seconds
- [ ] Verify all subtitles cover clip with no gaps

### Next Steps
1. **Install dependencies**: `bun install` in root
2. **Add Gemini API key**: Create `.env` from `.env.example`
3. **Test Whisper**: Ensure `pip install openai-whisper` successful
4. **Test FFmpeg**: Ensure `brew install ffmpeg` successful
5. **Run test**: `bun pipeline/index.ts input/test.mp4`

---

## Phase 3: Remotion Project 🚀 (In Progress)

- [x] Create `remotion/package.json` — Workspace with Remotion dependency
- [x] Create `remotion/tsconfig.json` — TypeScript config
- [x] Create `remotion/remotion.config.ts` — Dimensions (1080x1920), FPS (30), public folder
- [x] Create `remotion/src/index.tsx` — Register RemotionRoot
- [x] Create `remotion/src/Root.tsx` — Register ClipComposition
- [x] Create `remotion/src/ClipComposition.tsx` — Main composition
- [x] Create `remotion/src/components/HookTitle.tsx` — Persistent title
- [x] Create `remotion/src/components/BilingualCaption.tsx` — Synced captions
- [x] Create `remotion/src/components/HighlightedText.tsx` — Yellow word highlights
- [x] Create `remotion/src/components/VocabCard.tsx` — Pop-up vocab cards
- [ ] Test Remotion studio with sample clip.json
- [ ] Verify all 4 visual layers render correctly
- [ ] Verify clip.json loads from public folder
- [ ] Verify animations (fade-in/out, slide-up) work smoothly

### Next Steps
1. **Install dependencies**: `bun install` in root (installs Remotion workspace)
2. **Copy sample clip.json**: Place `output/example/clip.json` in `remotion/public/`
3. **Copy sample video**: Symlink or copy source MP4 to `remotion/public/`
4. **Start studio**: `cd remotion && bun remotion studio`
5. **Preview**: Check all components in browser at http://localhost:3000

---

## Phase 4: Slash Commands 🚀 (In Progress)

- [x] Create `.claude/commands/process-video.md` — Full pipeline execution
- [x] Create `.claude/commands/render.md` — Render clip.json to MP4
- [x] Create `.claude/commands/edit-clip.md` — Natural language editing of clip.json
- [x] Create `.claude/commands/preview.md` — Remotion studio preview
- [ ] Test `/process-video` command with sample video
- [ ] Test `/edit-clip` command (change hook title, adjust timestamps)
- [ ] Test `/preview` command (launch studio)
- [ ] Test `/render` command (generate final MP4)

### Next Steps
1. **Place sample video**: Put a 5-10 min test video in `input/test.mp4`
2. **Run `/process-video test.mp4`**: Should generate `output/test/clip.json`
3. **Run `/edit-clip test`**: Try changing the hook title via natural language
4. **Run `/preview test`**: Should launch Remotion studio
5. **Run `/render test`**: Should generate `output/test/render.mp4`

---

## Phase 5: Integration & Testing 🔄

- [ ] End-to-end test: `/process-video` → `/edit-clip` → `/preview` → `/render`
- [ ] Verify MP4 output is playable and dimensions correct (1080x1920)
- [ ] Verify captions sync to speech
- [ ] Verify highlights appear on correct words
- [ ] Verify vocabulary cards pop up at correct times
- [ ] Verify hook title is always visible
- [ ] Check file sizes and disk usage
- [ ] Performance benchmarks:
  - [ ] Pipeline: <10 minutes
  - [ ] Render: 2-5 minutes per 45s clip
  - [ ] Total workflow: <15 minutes

---

## Phase 6: Documentation & Polish 🎨

- [x] Update `CLAUDE.md` with project context and schema reference
- [ ] Add error handling & helpful error messages to pipeline
- [ ] Add progress logging to each pipeline step
- [ ] Create example clip.json for reference
- [ ] Add troubleshooting guide to `.claude/commands/`
- [ ] Performance optimization notes
- [ ] Test on different machines / OS

---

## Known Issues & TODOs

### Critical Path
- [ ] Verify Whisper handles mixed EN/JP content correctly
- [ ] Verify Gemini API returns properly formatted JSON
- [ ] Ensure clip.json schema validation catches all errors
- [ ] Test with real user (creator) feedback

### Nice to Have
- [ ] Add subtitle gap detection & warnings
- [ ] Auto-detect best audio quality for extraction
- [ ] Cache Whisper models locally
- [ ] Add progress bar to render output
- [ ] Support batch processing (multiple videos)

### Potential Issues
- **Whisper hallucination**: May repeat phrases in silence
  - Mitigation: Manual review via `/edit-clip`
- **Gemini clip selection**: May not always choose the "best" segment
  - Mitigation: User can adjust via `/edit-clip` or provide better prompt
- **Render memory**: Very long videos may OOM
  - Mitigation: Keep clips <60s (enforced)
- **Bilingual translation quality**: Depends on Gemini
  - Mitigation: User can edit via `/edit-clip`

---

## Environment Setup Checklist

Before first run:
- [ ] Ensure `ffmpeg` installed: `ffmpeg -version`
- [ ] Ensure `whisper` installed: `whisper --help`
- [ ] Ensure Bun installed: `bun --version`
- [ ] Create `.env` with `GEMINI_API_KEY=...`
- [ ] Download Whisper model: `whisper dummy.wav --model base`
- [ ] Test Bun workspace: `bun install` in root
- [ ] Test Remotion: `cd remotion && bun remotion studio` (should open browser)

---

## Estimated Remaining Work

| Phase | Est. Time | Status |
|-------|-----------|--------|
| Phase 2: Pipeline | 1-2 hours | Testing & validation |
| Phase 3: Remotion | 2-3 hours | Testing & validation |
| Phase 4: Slash Commands | 1 hour | Auto-generated from markdown |
| Phase 5: Integration | 2-3 hours | E2E testing, debugging |
| Phase 6: Polish | 1-2 hours | Docs, error handling |
| **Total** | **7-11 hours** | In Progress |

---

## Success Criteria

✅ **Code Quality**:
- TypeScript strict mode enabled
- No `any` types
- Schema validation enforced
- Error messages helpful

✅ **Functionality**:
- Pipeline produces valid clip.json in <10 minutes
- Remotion renders to playable MP4
- All visual components visible and readable
- Captions sync to speech
- Vocabulary cards timed correctly

✅ **User Experience**:
- Clear step-by-step workflow
- Natural language editing works intuitively
- Clear error messages for common issues
- Documentation complete and accessible

✅ **Performance**:
- Pipeline: <10 minutes per 10-min video
- Render: 2-5 minutes per 45-60s clip
- Disk space: <200 MB per video

---

## Version History

- **v0.1.0** (Current): Initial implementation
  - Core pipeline (transcribe → analyze → render)
  - 4 visual components
  - 4 slash commands
  - Full documentation

---

## Contact & Notes

- **Creator contact**: Should test this with real Business English videos
- **Feedback**: Any issues with Whisper accuracy, Gemini output, or rendering?
- **Next iteration**: Batch processing, cloud rendering, social media integration
