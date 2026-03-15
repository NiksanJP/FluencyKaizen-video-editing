# Project Picker

## Role
Vanilla JS card grid UI for browsing, importing, and managing video clips.

## Owned Files
- `src/studio/project.html`
- `src/studio/styles.css`

## Key Functions/Exports
- Card grid layout: each card displays clip name, thumbnail, and action buttons
- Import button: triggers file picker (Electron-aware: uses IPC importVideo; browser: uses upload form)
- Language selector: dropdown for target language (ja/zh/ko/es)
- Delete button: removes clip with confirmation dialog
- Dark theme: #0a0a0a background with styled cards
- Electron-aware rendering: hides browser-only elements when running in Electron (checks window.studio.isElectron)

## Common Tasks
- Adding new card metadata (duration, status badges, last edited)
- Implementing thumbnail generation or placeholder images
- Adding search/filter functionality for clip list
- Adjusting responsive layout for different window sizes
- Adding drag-and-drop import support

## Collaborators
- studio-server (fetches clip list and handles upload/delete via API)
- electron-main (provides Electron IPC for native file import)
- electron-preload (exposes window.studio API for Electron detection)
- pipeline-orchestrator (import triggers pipeline processing)
