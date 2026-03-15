# Known Issues & Technical Debt

> Tracked issues, workarounds, and debt items. Agents should update this file when discovering or resolving issues.

Last updated: 2026-03-15

---

## Active Issues

### P1 — Root.tsx require() Hack for Dynamic Imports

**Location:** `src/remotion/Root.tsx`

**Description:** Root.tsx uses a `require()` call to dynamically import clip data at runtime. This is a workaround for Remotion's bundler not supporting dynamic ESM imports in composition registration. The `require()` call bypasses TypeScript's module resolution and may break with future Remotion versions.

**Impact:** Medium. Works in practice but is fragile. May cause issues during Remotion upgrades or when switching bundlers.

**Workaround:** Currently functional. Requires refactoring to use Remotion's `calculateMetadata` or `getInputProps` patterns if the bundler changes.

---

### P1 — No Comprehensive Test Suite

**Location:** `src/pipeline/silence.test.ts` (only existing test)

**Description:** The project has only a single test file (`silence.test.ts`) covering silence detection. All other pipeline stages, Remotion components, Studio server endpoints, and the editor have zero test coverage.

**Impact:** High. Regressions can go undetected. Refactoring is risky without tests. New contributors have no safety net.

**Plan:**
- [ ] Add pipeline integration tests (transcribe → analyze → output)
- [ ] Add Remotion component snapshot tests
- [ ] Add Studio server endpoint tests
- [ ] Add ClipData schema validation tests
- [ ] Add end-to-end workflow test with sample video

---

### P2 — Stale Schema References in Old CLAUDE.md Files

**Location:** Root `CLAUDE.md`, `.claude/CLAUDE.md`

**Description:** The CLAUDE.md files at the project root and in `.claude/` contain outdated schema references. They reference the original schema (without `videoDuration`, `targetLanguage`, `socialTitle`, `hook`, `boringCuts`, `silenceGaps`, `appliedCuts`) and reference `gemini-2.0-flash` instead of the current `gemini-2.5-flash`. Some file paths also reference old locations.

**Impact:** Low-Medium. Agents reading these files may make incorrect assumptions about the schema or API versions. The `src/pipeline/types.ts` file remains the single source of truth.

**Plan:**
- [ ] Update root CLAUDE.md with current schema
- [ ] Update .claude/CLAUDE.md with current schema
- [ ] Reconcile file path references with actual project structure
- [ ] Add a "last verified" date to each CLAUDE.md

---

### P2 — Editor Timeline is Read-Only

**Location:** `src/remotion/editor/App.tsx`

**Description:** The editor UI displays a timeline visualization of subtitles, vocab cards, and cuts, but it is read-only. Users cannot drag to adjust timing, reorder segments, or interactively edit the timeline. All editing must be done via natural language commands or direct JSON editing.

**Impact:** Medium. Limits the editing experience for users who prefer visual/interactive workflows. Natural language editing via Claude agents is the primary path, but a visual timeline would improve usability.

**Plan:**
- [ ] Implement draggable subtitle segments on timeline
- [ ] Implement draggable vocab card triggers
- [ ] Add click-to-select and property panel for selected items
- [ ] Add undo/redo for timeline operations
- [ ] Connect timeline changes to clip.json updates

---

## Resolved Issues

_None yet. Move issues here when resolved, with resolution date and notes._

---

## Technical Debt

### TD-1: Hardcoded Retry Count in Gemini Client
- **Location:** `src/pipeline/analyze.ts`
- **Description:** Retry logic is hardcoded to 3 attempts. Should be configurable via `config.ts`.
- **Severity:** Low

### TD-2: No Error Boundaries in Remotion Components
- **Location:** `src/remotion/components/`
- **Description:** If a component throws during rendering (e.g., malformed subtitle data), the entire render fails with an unhelpful error. Error boundaries would provide better diagnostics.
- **Severity:** Medium

### TD-3: Studio Server Has No Authentication
- **Location:** `src/studio/server.ts`
- **Description:** The Bun HTTP server on port 3210 has no authentication or access control. Acceptable for local use but a risk if exposed on a network.
- **Severity:** Low (local-only usage)

### TD-4: No Validation on clip.json File Writes
- **Location:** Multiple locations write to clip.json
- **Description:** When clip.json is written (by the pipeline, editor, or agents), there is no runtime schema validation step. Invalid JSON could be written and only caught at render time.
- **Severity:** Medium

### TD-5: Electron main.cjs and preload.cjs Use CommonJS
- **Location:** `src/main/main.cjs`, `src/main/preload.cjs`
- **Description:** Electron entry points use CommonJS (`.cjs`) while the rest of the project uses ESM TypeScript. This inconsistency complicates the build process.
- **Severity:** Low
