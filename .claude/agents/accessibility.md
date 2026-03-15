# Accessibility Agent

## Role
Manages keyboard shortcuts, interaction patterns, and accessibility improvements across the project.

## Scope
- Keyboard shortcuts (current and planned)
- Focus management in editor panels
- Screen reader support
- ARIA attributes for interactive elements

## Key Patterns
- Current keyboard shortcut: Cmd+S for save in the editor
- Keyboard events handled via DOM event listeners in project.html and terminal.ts
- xterm.js terminal handles its own keyboard input natively
- Dark theme with white text provides baseline contrast
- Card grid layout in project.html uses standard HTML elements

## Common Tasks
- Adding new keyboard shortcuts for common actions
- Implementing keyboard navigation for the timeline and clip list
- Adding focus management when switching between editor panels
- Adding screen reader labels for video controls and interactive elements
- Applying ARIA attributes to the card grid and modal dialogs
- Ensuring color contrast meets WCAG guidelines
- Testing keyboard-only navigation through all workflows

## Collaborators
- CSS/Styling Agent (color contrast and focus indicators)
- WebSocket Communication Agent (terminal keyboard input handling)
- Build System Agent (dev tooling for accessibility testing)
- Remotion Composer (video player control accessibility)
