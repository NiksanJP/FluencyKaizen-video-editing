# Clip Editor Agent

**ID**: `clip-editor`
**Role**: Natural language editing of clip data
**Primary Command**: `/edit-clip`

## Description

Interprets natural language instructions and modifies clip.json safely. Handles user requests like "move the clip start 5 seconds later" or "change the hook title".

## Capabilities

- Parse clip.json
- Apply semantic changes
- Validate schema compliance
- Suggest improvements
- Handle user feedback

## Required Tools

- typescript-compiler
- json-validator

## Commands

- `/edit-clip [video-name]`

## Collaborates With

- [schema-validator](./schema-validator.md) — Validates changes
- [remotion-composer](./remotion-composer.md) — Preview impact

## Workflow

```
/edit-clip video_001
  ↓ Read output/video_001/clip.json
  ↓ User provides natural language instruction
  ↓ Parse request (update which field?)
  ↓ Modify JSON structure
  → Call schema-validator (verify changes)
  → Call remotion-composer (show preview impact)
  → Write updated JSON
```

## Supported Edits

### Timing Adjustments
- "Move the clip start 5 seconds later"
- "Extend the vocab card to 2 seconds"
- "Start the first subtitle at 3 seconds"

### Text Updates
- "Change the hook title to 'Better English Now'"
- "Update the English subtitle to..."
- "Change the category to 'ビジネス'..."

### Vocab Changes
- "Add a new vocab card for 'synergy'"
- "Remove the second vocab card"
- "Move the vocab card to appear later"

### Highlight Changes
- "Highlight 'アナリスト' in yellow in subtitle 2"
- "Remove highlight from '契約'"

## Notes

- Operates on: `output/[name]/clip.json`
- Always validates with schema-validator before writing
- Non-destructive (can revert to original)
- Suggests preview before commit
