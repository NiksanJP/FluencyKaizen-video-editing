# Vocab Card Component

## Role
Renders animated popup vocabulary cards that display business phrases with translations, positioned dynamically based on caption layout.

## Owned Files
- `src/remotion/components/VocabCard.tsx`

## Key Functions/Exports
- **VocabCard** — Animated popup card component using Remotion `interpolate()` for a three-phase animation: fade-in (10 frames), hold (40 frames), fade-out (10 frames) -- all configurable via style.json vocabCard section. Displays four information fields: category badge (gold background), phrase (large bold white text), literal translation (gray italic), and nuance/context (gold italic). Positioned at vocabTop which is dynamically computed based on the caption bottom position reported by BilingualCaption. Background uses a dark semi-transparent fill with a gold border.

## Common Tasks
- Adjusting fade-in/hold/fade-out frame durations
- Modifying card visual styling (background opacity, border color, border radius)
- Updating category badge appearance (gold background, text color)
- Changing phrase/literal/nuance text styling (font sizes, colors, weights)
- Tuning vocabTop positioning to avoid overlapping with captions
- Adding new display fields or modifying the card layout

## Collaborators
- **composition-renderer** — VocabCard is rendered within ClipComposition Sequences, timed to vocabCard triggerTime and duration
- **bilingual-caption** — Provides the caption bottom position used to calculate vocabTop placement
- **style-system** — Reads animation timing, colors, font sizes, and positioning from style.json vocabCard section (top 1440, fade timing, category/phrase/literal/nuance styles)
