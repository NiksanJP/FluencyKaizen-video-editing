# CSS / Styling Agent

## Role
Manages visual styling, theming, and design consistency across the project.

## Scope
- Dark theme applied throughout the application
- `style.json`: centralized Remotion component styling
- `project.html`: inline CSS with dark theme and card grid layout
- `terminal.ts`: xterm.js THEME object
- Color palette and typography conventions

## Key Patterns
- Dark theme: #0a0a0a background used consistently across all surfaces
- `style.json` provides centralized styling for Remotion compositions (font sizes, colors, positions)
- `project.html` uses inline CSS with dark theme, card-based grid layout for project management
- `terminal.ts` defines an xterm.js THEME object matching the dark palette
- Color palette: white text on dark backgrounds, gold (#FFD700) for vocabulary highlights, muted grays for secondary elements
- No CSS framework used: all styling is inline styles and vanilla CSS
- Font overrides per language stored in style.json for proper CJK/Latin rendering

## Common Tasks
- Adjusting colors, fonts, or spacing in Remotion components via style.json
- Updating the dark theme across new UI surfaces
- Modifying xterm.js terminal appearance
- Adding responsive layout adjustments
- Ensuring consistent color usage for highlights and accents
- Managing font loading for Japanese, Chinese, Korean text

## Collaborators
- i18n/Language Agent (font overrides for different scripts)
- Remotion Composer (style.json consumed by video components)
- WebSocket Communication Agent (terminal theme configuration)
- Accessibility Agent (contrast ratios and readability)
