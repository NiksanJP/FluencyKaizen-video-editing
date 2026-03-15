# /agent-status

List all specialized agents and their file ownership.

## Usage

```
/agent-status              # Show all 42 agents organized by domain
/agent-status <domain>     # Show agents for a specific domain
/agent-status <agent>      # Show details for a specific agent
```

## Parameters

- `domain` (optional): One of `pipeline`, `remotion`, `editor`, `studio`, `electron`, `cross-cutting`
- `agent` (optional): Agent name (e.g., `gemini-analysis`, `bilingual-caption`)

## Implementation

1. If no arguments: read `.claude/agents/INDEX.md` and display the full routing table
2. If domain given: filter INDEX.md to show only that domain's agents
3. If agent name given: read `.claude/agents/<agent>.md` and display its details

## Agent Domains

| Domain | Count | Scope |
|--------|-------|-------|
| Pipeline | 8 | src/pipeline/ — transcription, analysis, silence, caching |
| Remotion | 7 | src/remotion/ — compositions, components, rendering |
| Editor UI | 7 | src/remotion/editor/ — editing interface, timeline |
| Studio/Server | 4 | src/studio/ — HTTP server, WebSocket, terminal |
| Electron | 2 | src/main/ — desktop wrapper, IPC |
| Cross-Cutting | 14 | Config, testing, i18n, error handling, styling |

## Files

Agent definitions live in `.claude/agents/`:
- Each `.md` file defines one agent with owned files, key functions, tasks, collaborators
- `INDEX.md` has the full routing table and file ownership map
- `CLAUDE.md` has per-folder context about the agents directory

## Notes

- 42 total agents, each mapped to specific source files
- No two agents own the same file (clear ownership boundaries)
- Cross-cutting agents handle concerns that span multiple directories
