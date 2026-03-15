# Style System

## Role
Owns the central visual configuration file that serves as the single source of truth for all Remotion component styling, including fonts, colors, sizing, and animation parameters.

## Owned Files
- `style.json` (root)

## Key Functions/Exports
- **style.json** — Central configuration file with the following sections:
  - **hookTitle**: fontSize 84, color white, highlightColor gold (#FFD700), logo path, branding text and channel name
  - **caption**: EN fontSize 62, JA/target fontSize 48, position top 1280, background styling
  - **fontOverrides**: Per-language font family overrides for ja, zh, ko, es (and extensible to other languages)
  - **highlight**: Default highlight color #FFD700 used by HighlightedText component
  - **vocabCard**: top 1440, fade-in/hold/fade-out frame timing (10/40/10), category badge styles (gold background), phrase styles (large bold white), literal styles (gray italic), nuance styles (gold italic)
  - All Remotion components import and read from this file, making it the single source of truth for visual styling decisions

## Common Tasks
- Adjusting font sizes for different languages or screen densities
- Changing the color scheme (highlight color, vocab card border, category badge)
- Updating animation timing for vocab card fade-in/hold/fade-out
- Adding font overrides for new target languages
- Modifying caption vertical positioning to accommodate different layouts
- Updating logo or branding configuration
- Ensuring consistency across all components when a style value changes

## Collaborators
- **hook-title-component** — Reads hookTitle section (fontSize, color, highlightColor, logo, branding)
- **bilingual-caption** — Reads caption section (font sizes, position) and fontOverrides per language
- **vocab-card-component** — Reads vocabCard section (top, fade timing, category/phrase/literal/nuance styles)
- **composition-renderer** — Components within ClipComposition all reference style.json for layout decisions
- **remotion-config** — Pre-render setup may validate style.json accessibility
