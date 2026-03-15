# .claude/commands/

Slash command definitions for user-invocable operations.

## Format

Each `.md` file defines a command with:
- **Usage syntax** and parameters
- **Implementation steps** (what the command does)
- **Primary agent** that handles execution

## Available Commands

| Command | Purpose | Agent |
|---------|---------|-------|
| `/process-video` | Run full pipeline on a video file | Pipeline Orchestrator |
| `/edit-clip` | Natural language editing of clip.json | Clip Editor |
| `/render` | Render clip to MP4 | Remotion Composer |
| `/preview` | Launch Remotion Studio preview | Remotion Composer |
| `/validate-clip` | Check clip.json against schema | Schema Validator |
| `/refresh` | Regenerate clip-data-all.ts and symlinks | Remotion Composer |
| `/list-clips` | Show all generated clips | Documentation Curator |
| `/setup-env` | Verify dependencies and environment | Setup Manager |
| `/clean-output` | Remove temporary/output files | Setup Manager |
| `/test-pipeline` | Run integration tests | Test Coordinator |
| `/studio` | Launch studio server | Studio Server |
| `/docs` | Open or update documentation | Documentation Curator |
| `/agent-status` | Show agent health and activity | Agent framework |
