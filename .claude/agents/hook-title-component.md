# Hook Title Component

## Role
Renders the persistent hook title overlay that remains visible throughout the entire clip, with highlight words, branding, and animated logo.

## Owned Files
- `src/remotion/components/HookTitle.tsx`

## Key Functions/Exports
- **HookTitle** — React component that displays `hookTitle.target` (falls back to `hookTitle.ja` if target is not available). Highlight words within the title are rendered in yellow (#FFD700). Includes a rotating logo animation and a branding row showing the channel name. Reads dimensions, font sizes, and color values from the `hookTitle` section of `style.json`. Uses Remotion `spring()` for entrance and emphasis animations.

## Common Tasks
- Adjusting title text styling (font size, color, stroke, shadow)
- Modifying highlight word color or detection logic
- Updating logo rotation animation parameters
- Changing branding row layout or channel name display
- Tuning spring() animation timing and damping values
- Adapting to new fields in the hookTitle section of style.json

## Collaborators
- **composition-renderer** — HookTitle is rendered as a child within ClipComposition's Sequence layers
- **style-system** — All visual parameters (fontSize 84, color white, highlightColor gold, logo path, branding text) are read from style.json hookTitle section
- **bilingual-caption** — Shares vertical screen space; hook title occupies the top area while captions occupy the lower third
