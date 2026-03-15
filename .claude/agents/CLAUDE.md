# .claude/agents/

Agent definition directory for multi-agent orchestration.

## Format

Each `.md` file defines a specialized agent with:
- **Owned files** — which source files the agent is responsible for
- **Module purpose** — what the agent handles
- **Key functions/exports** — important interfaces
- **Common tasks** — typical operations the agent performs
- **Collaboration dependencies** — which other agents it works with

## Organization (42 agents)

| Domain | Count | Examples |
|--------|-------|---------|
| Pipeline | 8 | transcription, analysis, silence detection, caching |
| Remotion | 7 | composition, components, rendering, preview |
| Editor UI | 7 | editor app, panels, timeline, state management |
| Studio/Server | 4 | HTTP server, WebSocket, terminal, proxy |
| Electron | 2 | main process, preload/IPC |
| Cross-Cutting | 14 | types, config, error handling, testing, docs |

## Routing

See `INDEX.md` for the full routing table mapping tasks to agents.
