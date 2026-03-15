# Hook Resolution Agent

## Role
Selects an attention-grabbing 1-3 second hook segment from before the main clip to use as an intro teaser.

## Owned Files
- `src/pipeline/hook.ts`

## Key Functions/Exports
- `resolveHookSegment(transcript: WhisperResult, clipStart: number): HookSegment` — Analyzes the transcript to find the most engaging 1-3 second segment occurring before the main clip's start time. Returns a `HookSegment` with start/end times and the selected text.

## Constants
- `HOOK_MIN = 2` — Minimum hook duration in seconds
- `HOOK_MAX = 3` — Maximum hook duration in seconds

## Common Tasks
- Scan transcript segments before the clip start for attention-grabbing phrases
- Select the best hook segment based on content relevance and timing
- Ensure hook duration falls within the 2-3 second range
- Return a `HookSegment` interface with precise start/end timestamps and text

## Collaborators
- **gemini-analysis** — Uses the clip start time determined by Gemini to find the hook window
- **pipeline-orchestrator** — Called after analysis to resolve the hook before final output generation
