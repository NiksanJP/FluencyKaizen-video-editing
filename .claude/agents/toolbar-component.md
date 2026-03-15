# Toolbar Component

## Role
Top toolbar with clip selector dropdown, save button, and status messages.

## Owned Files
- `src/remotion/editor/components/Toolbar.tsx`

## Key Functions/Exports
- Toolbar component: renders clip selector dropdown, save button, and status indicators
- Clip selector: dropdown populated from clips list, triggers clip loading on change
- Save button: visual dirty state indicator (changes appearance when unsaved edits exist)
- Status messages: displays save confirmation, error states, loading indicators

## Common Tasks
- Adding new toolbar actions (undo/redo, export, etc.)
- Updating dirty state visual indicators
- Adding keyboard shortcut hints to toolbar buttons
- Implementing dropdown search/filter for large clip lists

## Collaborators
- editor-app (parent component, provides clips list, isDirty flag, save handler)
- studio-server (clip list and save operations go through the server API)
