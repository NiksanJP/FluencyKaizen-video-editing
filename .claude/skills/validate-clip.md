# /validate-clip

**Category**: Validation
**Agent**: [Schema Validator](../agents/schema-validator.md)
**Requires Approval**: No

## Description

Validate clip.json against the ClipData schema. Check data integrity and identify potential issues.

## Usage

```bash
/validate-clip [video-name]

# Example:
/validate-clip video_001
```

## What It Does

1. **Loads** — Reads `output/[name]/clip.json`
2. **Checks Structure** — Verifies all required fields
3. **Validates Types** — Ensures correct data types
4. **Checks Timing** — Validates timestamps
5. **Checks Content** — Verifies text and highlights
6. **Reports** — Displays validation results

## Validation Checks

### Structure ✓

- [x] Required fields present (videoFile, hookTitle, clip, subtitles, vocabCards)
- [x] No unknown/extra fields
- [x] Correct nesting

### Data Types ✓

- [x] Timestamps are numbers (not strings)
- [x] Text fields are strings (non-empty)
- [x] Arrays have correct structure
- [x] Category and duration are valid

### Timing ✓

- [x] No negative timestamps
- [x] Subtitles don't overlap
- [x] Vocab cards appear during clip
- [x] All times within video duration

### Content ✓

- [x] Highlights exist in Japanese text
- [x] English and Japanese text present
- [x] Category names are valid
- [x] Meaningful descriptions

## Example Output

```
Validating: output/video_001/clip.json

✓ Structure: Valid
✓ Data Types: All correct
✓ Timestamps: No conflicts

⚠ Warnings:
  - Subtitle 2 is very long (8 seconds)
  - Only 2 vocab cards (typically 3-5 recommended)

✓ Overall: Valid

Summary:
- Fields: 5/5 required
- Subtitles: 8 segments
- Vocab cards: 2 cards
- Duration: 45 seconds
```

## Example with Errors

```
Validating: output/video_001/clip.json

✗ Errors Found:

1. Missing field: hookTitle.en
   Location: root.hookTitle
   Fix: Add English hook title

2. Invalid type: startTime should be number, got string
   Location: subtitles[0].startTime
   Value: "5.2" (should be: 5.2)
   Fix: Use numbers instead of strings

3. Highlight word not found
   Subtitle 2: "これは重要です"
   Tried to highlight: "グローバル"
   Fix: Use exact word from Japanese text

4. Vocab card time out of bounds
   VocabCard 2: triggerTime = 50.5s
   Clip duration: 45s
   Fix: Move to before 45 seconds

Total: 4 errors, 0 warnings
Fix these before rendering.
```

## When to Validate

**Automatically** (no need to run manually):
- After `/process-video` (pipeline runs validator)
- After `/edit-clip` (editor runs validator)

**Manually** (run explicitly):
```bash
# Before rendering (best practice)
/validate-clip video_001
/render video_001

# After manual edits to clip.json
/validate-clip video_001

# Troubleshooting issues
/validate-clip video_001
```

## Fixing Errors

Common fixes:

**Missing field**
```bash
/edit-clip video_001 "Add English hook title 'Better English'"
```

**Type mismatch**
```bash
# Use /edit-clip (it handles types correctly)
/edit-clip video_001 "Move subtitle 1 start to 3.5 seconds"
```

**Highlight not found**
```bash
# Check spelling and use exact text
/edit-clip video_001 "Highlight 'グローバル' in subtitle 2"
```

**Timing out of bounds**
```bash
# Move event to valid time range
/edit-clip video_001 "Move vocab card to appear at 20 seconds"
```

## Schema Reference

```typescript
interface ClipData {
  videoFile: string;                    // source filename
  hookTitle: { ja: string; en: string }; // both languages
  clip: { startTime: number; endTime: number }; // seconds (float)
  subtitles: SubtitleSegment[];        // array of segments
  vocabCards: VocabCard[];             // array of cards
}

interface SubtitleSegment {
  startTime: number;                   // seconds
  endTime: number;                     // seconds
  en: string;                          // English text
  ja: string;                          // Japanese text
  highlights: string[];                // words to highlight (from ja)
}

interface VocabCard {
  triggerTime: number;                 // when to show (seconds)
  duration: number;                    // how long (seconds)
  category: string;                    // e.g. "ビジネス英語"
  phrase: string;                      // e.g. "on the same page"
  literal: string;                     // literal translation
  nuance: string;                      // context/meaning (Japanese)
}
```

## Best Practices

1. **Validate before rendering** — Catch issues early
2. **Fix warnings** — They often indicate quality issues
3. **Use /edit-clip** — It validates automatically
4. **Keep backups** — Git commit working versions
5. **Review highlights** — Make sure words are spelled right

## Troubleshooting

**"clip.json not found"**
- Run `/process-video` first

**"Unexpected token"**
- clip.json is corrupted
- Restore from backup or regenerate

**"Validation timeout"**
- Clip is very large (> 10 minutes)
- Try validating a shorter section

## See Also

- [Schema Validator](../agents/schema-validator.md)
- [/edit-clip](./edit-clip.md) — Make corrections
- [/process-video](./process-video.md) — Generate new clip
- [ClipData Schema](../../pipeline/types.ts)
