# Timeline Adapter

## Role
Converts ClipData into a TimelineProject with typed tracks for timeline visualization.

## Owned Files
- `src/remotion/editor/timeline/adapter.ts`

## Key Functions/Exports
- clipDataToTimeline(clipData): converts a ClipData object into a TimelineProject
- Creates 4 tracks: video (single item spanning full clip), title (persistent hook title), captions (one item per subtitle segment), vocab (one item per vocab card)
- Each TimelineItem has start (seconds), duration (seconds), label, and metadata
- Handles edge cases: missing subtitles, overlapping vocab cards, empty highlights

## Common Tasks
- Adding new track types (e.g., sound effects, transitions)
- Adjusting item label formatting for different track types
- Handling bidirectional sync (timeline edits back to ClipData)
- Supporting multi-clip timeline views

## Collaborators
- timeline-state (adapter output populates the timeline store)
- timeline-component (rendered tracks come from adapter output)
- schema-validator (validates ClipData before conversion)
- editor-app (provides source ClipData to the adapter)
