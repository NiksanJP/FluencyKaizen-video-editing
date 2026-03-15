# Edit Panel

## Role
Form-based editing UI for subtitle segments and vocabulary cards within a clip.

## Owned Files
- `src/remotion/editor/components/EditPanel.tsx`

## Key Functions/Exports
- EditPanel component: renders editing forms based on selected subtitle or vocab card
- Subtitle editing form: fields for startTime, endTime, en, target (ja), highlights, enHighlights, emoji
- Vocab card editing form: fields for triggerTime, duration, category, phrase, literal, nuance
- Updates propagated via onUpdateClip callback to parent App component

## Common Tasks
- Adding new editable fields to subtitle or vocab forms
- Implementing validation for time ranges and required fields
- Adding inline preview of highlight styling
- Supporting batch editing of multiple subtitles

## Collaborators
- editor-app (parent component, provides selected item data and onUpdateClip callback)
- schema-validator (validates edited ClipData against schema)
- player-panel (preview updates reflect edit changes in real time)
