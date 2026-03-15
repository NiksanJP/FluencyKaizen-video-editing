# Styling

## Domain
Visual styling system driven by style.json. All Remotion components read from this central configuration file for consistent appearance.

## Key Files
- `style.json` — Root styling configuration (single source of truth)
- `src/remotion/components/HookTitle.tsx` — Reads hookTitle styles
- `src/remotion/components/BilingualCaption.tsx` — Reads caption styles
- `src/remotion/components/HighlightedText.tsx` — Reads highlight styles
- `src/remotion/components/VocabCard.tsx` — Reads vocabCard styles

## Common Operations
- **Change visual style:** Edit `style.json` at project root
- **Preview changes:** Remotion Studio HMR picks up style.json changes automatically
- **Override font for language:** Add entry to `fontOverrides` section
- **Adjust vocab card timing:** Modify `vocabCard.timing` in style.json

## style.json Sections

### hookTitle
- Font size, color, stroke width
- Branding elements (logo, badge)
- Position and alignment

### caption
- English font: family, size, color, position
- Japanese font: family, size, color, position
- Target language font settings
- Line spacing and padding

### fontOverrides
- Per-language font family mappings
- Example: `{ "ja": "Noto Sans JP", "zh": "Noto Sans SC", "ko": "Noto Sans KR" }`

### highlight
- Gold color (#FFD700) for highlighted vocabulary words
- Font weight and style overrides

### vocabCard
- Card dimensions (width, height)
- Animation timing (enter, exit, duration)
- Sub-styles: category badge, phrase text, literal text, nuance text
- Background color, border radius, shadow

## Patterns & Conventions
- All visual properties live in style.json — no hardcoded colors or sizes in components
- Dark theme: #0a0a0a backgrounds, white text, gold (#FFD700) accents
- Components import and destructure style.json at the top level
- Remotion HMR reloads style.json changes without restart
- Inline styles in components reference style.json values

## Gotchas
- style.json must be valid JSON — syntax errors break all components
- Remotion HMR picks up changes but may need a frame seek to refresh
- Font families in fontOverrides must be installed on the system or loaded via @font-face
- Color values must be valid CSS (hex, rgb, rgba, named colors)
- Changing card dimensions may require adjusting composition layout
- Gold highlight color (#FFD700) is the brand accent — maintain consistency
