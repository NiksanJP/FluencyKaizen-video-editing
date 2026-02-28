# /edit-clip

**Category**: Editing
**Agent**: [Clip Editor](../agents/clip-editor.md)
**Requires Approval**: No

## Description

Edit clip.json using natural language instructions. Modify timing, text, vocab cards, and highlights without touching JSON directly.

## Usage

```bash
/edit-clip [video-name] [instruction]

# Example:
/edit-clip video_001 "Move the clip start 5 seconds later"
/edit-clip video_001 "Change the hook title to 'Better English Now'"
/edit-clip video_001 "Add a vocab card for synergy"
```

## Supported Edits

### Timing Adjustments

- "Move the clip start forward by 3 seconds"
- "Extend the vocab card duration to 2.5 seconds"
- "Shift the first subtitle to start at 5 seconds"
- "Make the entire clip 30 seconds instead of 45"

### Text Updates

- "Change the English hook title to 'Quick English Tips'"
- "Change the hook title to {ja: '日本語', en: 'English'}"
- "Update the first subtitle English to 'New text here'"
- "Translate the second subtitle to Japanese"

### Vocab Cards

- "Add a new vocab card for 'on the same page'"
- "Remove the third vocab card"
- "Move the vocab card for 'synergy' to appear at 15 seconds"
- "Change category to 'ビジネス英語'"

### Highlights

- "Highlight 'グローバル' in the second subtitle"
- "Add yellow highlight to '契約' in subtitle 3"
- "Remove the highlight from '案件' in subtitle 1"

## What It Does

1. **Reads** — Loads current `output/[name]/clip.json`
2. **Parses** — Understands your natural language request
3. **Modifies** — Updates the relevant JSON fields
4. **Validates** — Checks schema compliance
5. **Previews** — Shows impact in Remotion Studio
6. **Saves** — Writes updated JSON

## Example Workflow

```bash
# 1. Process video
/process-video input/video.mp4

# 2. Edit clip
/edit-clip video "Move clip start 3 seconds later"
/edit-clip video "Change hook title to 'Meeting English'"

# 3. Preview changes
/preview video

# 4. Make more edits if needed
/edit-clip video "Remove the last vocab card"

# 5. Render final
/render video
```

## Important Notes

- **Non-destructive**: Original JSON backed up
- **Validated**: Changes checked before saving
- **Reversible**: Can revert to previous version
- **Safe**: Never overwrites source files

## Validation

After edits, the system checks:

✓ All fields are present
✓ Timestamps are valid
✓ No overlapping subtitles
✓ Highlights exist in Japanese text
✓ Vocab cards appear during video
✓ Schema complies with ClipData type

## Troubleshooting

**"Invalid instruction"**
- Be more specific: "Change the hook title to 'Better English'"
- The editor understands natural language, be descriptive

**"Highlight word not found"**
- Check spelling in Japanese text
- Use the exact text from the subtitle

**"Timestamp out of bounds"**
- Make sure times are within clip duration
- Check with `/validate-clip video`

**"Cannot make edit"**
- Run `/validate-clip` first to check if clip is valid
- Try editing one field at a time

## Next Steps

After editing:

1. **Preview** — Run `/preview video` to see changes
2. **Validate** — Run `/validate-clip video` to check quality
3. **Render** — Run `/render video` to generate new MP4
4. **More Edits** — Use `/edit-clip` again to refine

## See Also

- [Clip Editor](../agents/clip-editor.md)
- [/validate-clip](./validate-clip.md) — Check edits
- [/preview](./preview.md) — See changes in Studio
- [ClipData Schema](../../pipeline/types.ts)
