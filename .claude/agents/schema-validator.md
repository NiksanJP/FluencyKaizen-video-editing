# Schema Validator Agent

**ID**: `schema-validator`
**Role**: Ensures data integrity
**Primary Command**: `/validate-clip`

## Description

Validates ClipData schema, detects gaps, and checks compliance. Acts as the gatekeeper for data quality across the pipeline.

## Capabilities

- Validate clip.json structure
- Check subtitle coverage
- Verify highlight words exist
- Detect timestamp errors
- Generate validation reports

## Required Tools

- typescript-compiler

## Commands

- `/validate-clip [video-name]`

## Collaborates With

- [clip-editor](./clip-editor.md) — Validates edits
- [error-handler](./error-handler.md) — Reports issues

## Workflow

```
/validate-clip video_001
  ↓ Read output/video_001/clip.json
  ↓ Check against ClipData schema
  ↓ Verify all required fields
  ↓ Validate timestamps
  ↓ Check subtitle & vocab card alignment
  → Report errors/warnings
  → Suggest fixes
```

## Validation Checks

### Structure
- ✓ All required fields present
- ✓ No extra/unknown fields
- ✓ Correct data types

### Timing
- ✓ `hookTitle` valid for entire clip
- ✓ Subtitles don't overlap
- ✓ Vocab cards appear during video
- ✓ No negative timestamps

### Content
- ✓ All highlights exist in Japanese text
- ✓ Non-empty EN/JA strings
- ✓ Valid category names
- ✓ Meaningful vocab descriptions

### Completeness
- ✓ All subtitles have both EN & JA
- ✓ All vocab cards have all fields
- ✓ Reasonable coverage (not too sparse)

## ClipData Schema Reference

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

## Notes

- Schema source: `pipeline/types.ts`
- Validation is strict by default
- Reports suggest corrections
- Used automatically by pipeline & editor
