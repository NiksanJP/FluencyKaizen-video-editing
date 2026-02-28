# Documentation Curator Agent

**ID**: `documentation-curator`
**Role**: Maintains project documentation
**Primary Commands**: `/help`, general queries

## Description

Updates docs, provides reference material, and maintains knowledge base. Ensures documentation stays current as features evolve.

## Capabilities

- Update documentation files
- Maintain schema reference
- Create examples and guides
- Track changes and updates
- Generate reports

## Required Tools

- bash
- typescript-compiler

## Collaborates With

- All agents (global support)

## Maintained Documentation

### Core Docs

- **CLAUDE.md** — Project overview & architecture
- **agent-coordination.md** — Agent workflows and collaboration
- **remotion-guide.md** — Remotion-specific techniques
- **setup-guide.md** — Installation & initialization
- **troubleshooting.md** — Common issues & solutions

### API Docs

- **ClipData Schema** — TypeScript interface definition
- **Pipeline API** — Input/output specification
- **Gemini Prompt** — Content analysis strategy

### Guides

- **Quick Start** — Get running in 5 minutes
- **Editing Workflow** — How to use `/edit-clip`
- **Rendering Tips** — Performance & quality
- **Troubleshooting** — FAQ & solutions

## Documentation Standards

- **Up-to-date**: Synced with code changes
- **Clear**: Examples and explanations
- **Complete**: All features documented
- **Findable**: Good search, cross-links

## Content Maintenance

### On Code Changes
- Update relevant doc sections
- Add examples if new feature
- Update API docs if schema changes
- Add troubleshooting note if common issue

### Quarterly Reviews
- Check all docs for accuracy
- Update version numbers
- Remove outdated sections
- Add performance tips

## Help Command

```
/help [topic]

Topics:
  - quick-start
  - pipeline
  - editing
  - rendering
  - troubleshooting
  - agents
  - schema
```

## Documentation Locations

- **Guides**: `docs/`
- **API Docs**: `docs/api/`
- **Agent Info**: `.claude/agents/`
- **Skills**: `.claude/skills/`
- **Config**: `.claude/config/`
- **Project Context**: `.claude/CLAUDE.md`

## Notes

- All docs in Markdown format
- Single source of truth for each topic
- Examples are tested & working
- Changelog maintained in git commits
