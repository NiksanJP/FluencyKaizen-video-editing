# src/remotion/components/

Visual overlay components rendered on top of video.

## Components (4)

### HookTitle.tsx
Persistent title overlay displayed for the full clip duration.
- Highlight rendering for key phrases
- Rotating logo animation
- Branding row at bottom of title area

### BilingualCaption.tsx
Synchronized bilingual captions (EN + target language).
- Emoji placement support
- Per-language font selection via `style.json` `fontOverrides`
- Bottom position callback for layout coordination with other overlays

### HighlightedText.tsx
Renders Japanese text with highlighted vocabulary words.
- Regex split using longest-match-first ordering to avoid partial matches
- Highlight color: `#FFD700` (yellow)

### VocabCard.tsx
Animated popup vocabulary card.
- Uses Remotion `interpolate()` for fade-in / hold / fade-out transitions
- Category badge (top-left corner)
- Fields: phrase, literal translation, nuance/context

## Shared Patterns

- All components read visual config from `style.json`
- All use Remotion hooks: `useCurrentFrame()`, `interpolate()`, `spring()`
- Timestamps converted from seconds to frames at 30 fps
