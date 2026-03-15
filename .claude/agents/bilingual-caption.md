# Bilingual Caption

## Role
Renders synchronized English and target language captions in the lower third of the video, with regex-based word highlighting and emoji support.

## Owned Files
- `src/remotion/components/BilingualCaption.tsx`
- `src/remotion/components/HighlightedText.tsx`

## Key Functions/Exports
- **BilingualCaption** — Renders synchronized EN + target language subtitle pairs in the lower third area. Handles emoji placement with four positions: en-prefix, en-suffix, target-prefix, target-suffix. Applies per-language font overrides from style.json `fontOverrides` section (ja, zh, ko, es). Reports its bottom position via a callback so VocabCard can be positioned dynamically below captions. Reads caption styling (font sizes, positioning) from style.json caption section.
- **HighlightedText** — Splits input text using regex-based longest-match-first matching against the `highlights` array from the subtitle segment. Matched words are rendered in yellow (#FFD700), unmatched text in the default color. Ensures correct splitting even with overlapping highlight terms by sorting matches by length descending.

## Common Tasks
- Adjusting caption font sizes (EN fontSize 62, JA/target fontSize 48)
- Modifying caption vertical position (default top: 1280)
- Adding or updating font overrides for new target languages
- Fixing emoji placement logic for different emoji position types
- Tuning the bottom-position callback for accurate vocabTop calculation
- Debugging highlight regex matching for edge cases (partial matches, special characters)

## Collaborators
- **composition-renderer** — BilingualCaption is rendered within ClipComposition Sequences, timed to subtitle startTime/endTime
- **vocab-card-component** — Receives the caption bottom position via callback to set its vocabTop placement
- **hook-title-component** — Shares vertical screen real estate; captions are positioned below the hook title
- **style-system** — Reads all visual configuration from style.json: caption section, fontOverrides, highlight color
