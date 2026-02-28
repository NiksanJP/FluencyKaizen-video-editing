# /validate-clip — Validate clip.json schema

## Usage
```
/validate-clip <video-name>
```

## Description
Validates that a clip.json file matches the ClipData schema and has no errors.

Checks:
- ✅ Valid JSON structure
- ✅ All required fields present
- ✅ Clip duration is 30-60 seconds
- ✅ Subtitle segments cover full clip with no gaps
- ✅ Highlight words exist in Japanese text
- ✅ Vocab cards have all required fields
- ✅ All timestamps are valid floats
- ✅ No overlapping subtitle segments

## Example
```
/validate-clip example
```

## Output
If valid:
```
✅ Validation passed: example/clip.json
- Clip duration: 45.5s ✓
- Subtitle coverage: 100% ✓
- 4 vocabulary cards ✓
- 12 subtitle segments ✓
```

If invalid:
```
❌ Validation failed:
- ERROR: Subtitle gap at 15.3-16.2s (no segment)
- ERROR: Highlight "こと" not found in Japanese text
- WARNING: Clip duration 25s (less than 30s minimum)
```

## Use Cases
- Before rendering: ensure clip is correct
- After editing: verify changes are valid
- Debugging: identify schema issues

## Schema Rules
- **Clip duration**: 30-60 seconds (required)
- **Subtitles**: Full coverage, <0.5s gaps
- **Highlights**: Must exist in Japanese text
- **Timestamps**: Floats (1.5, 2.0 OK; 1.5a invalid)
- **Vocab cards**: All 6 fields required (triggerTime, duration, category, phrase, literal, nuance)
