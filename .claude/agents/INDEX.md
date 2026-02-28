# Agent Directory

All agents that handle different aspects of the FluencyKaizen Video Automation pipeline.

## Quick Reference

| Agent | Role | Primary Commands | Collaborators |
|-------|------|------------------|---|
| [Pipeline Orchestrator](./pipeline-orchestrator.md) | Video processing pipeline | `/process-video` | Schema Validator, Error Handler |
| [Remotion Composer](./remotion-composer.md) | Video rendering & preview | `/preview`, `/render` | Clip Editor, Performance Optimizer |
| [Clip Editor](./clip-editor.md) | Natural language editing | `/edit-clip` | Schema Validator, Remotion Composer |
| [Schema Validator](./schema-validator.md) | Data integrity | `/validate-clip` | Clip Editor, Error Handler |
| [Error Handler](./error-handler.md) | Failure recovery | All tasks | All agents |
| [Performance Optimizer](./performance-optimizer.md) | Resource optimization | `/test-pipeline` | Remotion Composer, Pipeline Orchestrator |
| [Documentation Curator](./documentation-curator.md) | Project docs | `/help`, queries | All agents |
| [Setup Manager](./setup-manager.md) | Environment setup | `/setup-env`, `/clean-output` | Error Handler, Performance Optimizer |
| [Test Coordinator](./test-coordinator.md) | QA & testing | `/test-pipeline` | Pipeline Orchestrator, Remotion Composer, Schema Validator |

## Collaboration Modes

### Sequential
Agents work in sequence: Agent1 → Agent2 → Agent3
- **Best for**: Linear pipelines, dependent operations
- **Example**: `/process-video` runs Pipeline Orchestrator → Schema Validator → Error Handler

### Parallel
Multiple agents work simultaneously: Agent1 ∥ Agent2 ∥ Agent3
- **Best for**: Testing, validation, optimization
- **Example**: `/test-pipeline` runs all test agents in parallel

### Cooperative
Agents coordinate and communicate: Agent1 ↔ Agent2 ↔ Agent3
- **Best for**: Complex tasks, error recovery, optimization
- **Example**: `/edit-clip` involves Clip Editor ↔ Schema Validator ↔ Remotion Composer

## Task Routing

| Command | Primary | Secondary | Mode |
|---------|---------|-----------|------|
| `/process-video` | pipeline-orchestrator | schema-validator, error-handler | sequential |
| `/render` | remotion-composer | performance-optimizer, error-handler | sequential |
| `/edit-clip` | clip-editor | schema-validator, error-handler | sequential |
| `/preview` | remotion-composer | error-handler | sequential |
| `/validate-clip` | schema-validator | error-handler | sequential |
| `/test-pipeline` | test-coordinator | pipeline-orchestrator, remotion-composer, schema-validator | parallel |
| `/setup-env` | setup-manager | error-handler | sequential |
| `/list-clips` | documentation-curator | — | sequential |
| `/clean-output` | setup-manager | error-handler | sequential |

## Communication Protocol

- **Protocol**: JSON-RPC over stdout/stderr
- **Timeout**: 300 seconds (5 minutes)
- **Retries**: Up to 3 attempts
- **Channels**: stdout, stderr, logs
- **Logging**: `.claude/logs/agents/` (one per agent)

## Constraints

- **Max Parallel Agents**: 4
- **Memory per Agent**: 512MB
- **Task Timeout**: 10 minutes
- **Requires Approval For**: Destructive operations, external API calls, file deletions

## See Also

- [Skills Directory](../skills/INDEX.md) — Available commands
- [Config Directory](../config/INDEX.md) — Settings & integrations
- [CLAUDE.md](../CLAUDE.md) — Project overview
