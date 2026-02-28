# .claude Folder Reorganization

**Date**: February 27, 2026
**Status**: ✅ Complete

## Summary

Migrated `.claude` configuration from JSON files to organized markdown folder structure. Better readability, easier to navigate, and more maintainable.

---

## Changes Made

### Old Structure (JSON-based)
```
.claude/
├── agents.json              ❌ Moved to _archived/
├── skills.json              ❌ Moved to _archived/
├── mcp.json                 ❌ Moved to _archived/
├── settings.json            ❌ Moved to _archived/
├── (other files)
```

### New Structure (Markdown-based)
```
.claude/
├── agents/                  ✅ New folder
│   ├── INDEX.md             (Overview, quick reference)
│   ├── pipeline-orchestrator.md
│   ├── remotion-composer.md
│   ├── clip-editor.md
│   ├── schema-validator.md
│   ├── error-handler.md
│   ├── performance-optimizer.md
│   ├── documentation-curator.md
│   ├── setup-manager.md
│   └── test-coordinator.md
│
├── skills/                  ✅ New folder
│   ├── INDEX.md             (Overview, quick reference)
│   ├── process-video.md
│   ├── render.md
│   ├── edit-clip.md
│   ├── preview.md
│   ├── validate-clip.md
│   ├── list-clips.md
│   ├── setup-env.md
│   ├── test-pipeline.md
│   └── clean-output.md
│
├── config/                  ✅ New folder
│   ├── INDEX.md             (Overview)
│   ├── mcp.md               (Model Context Protocol)
│   └── settings.md          (Project configuration)
│
├── _archived/               ✅ Backup folder
│   ├── agents.json
│   ├── skills.json
│   ├── mcp.json
│   └── settings.json
│
└── (existing files)
    ├── CLAUDE.md
    ├── agent-coordination.md
    ├── remotion-guide.md
    ├── commands/
    ├── logs/
    └── ...
```

---

## File Count

| Category | Count | Type |
|----------|-------|------|
| Agents | 10 | 1 INDEX + 9 individual |
| Skills | 10 | 1 INDEX + 9 individual |
| Config | 3 | 1 INDEX + 2 detailed |
| **Total** | **23** | **Markdown files** |

---

## Benefits

### ✅ Readability
- Markdown is human-readable (no JSON parsing needed)
- Clear formatting with headers and tables
- Examples and usage instructions included

### ✅ Organization
- Logical folder structure (agents, skills, config)
- Each agent gets its own detailed page
- Each command gets its own documentation

### ✅ Navigation
- INDEX.md files provide quick reference in each folder
- Cross-links between related files
- Easy to find specific agent or skill

### ✅ Searchability
- Plaintext search works naturally
- Grep-friendly format
- Better IDE autocomplete

### ✅ Maintainability
- Easier to update documentation
- Add new agents/skills with new .md files
- Less chance of JSON syntax errors

### ✅ Git Friendly
- Diffs are more readable
- Easier to review changes
- Better merge conflict resolution

---

## Content Organization

### Agents Folder

**Index**: `agents/INDEX.md`
- Quick reference table (agent, role, commands)
- Collaboration modes (sequential, parallel, cooperative)
- Task routing map
- Communication protocol

**Per-Agent Format**:
- ID and role
- Description and capabilities
- Required tools
- Commands
- Collaborators
- Workflow diagram
- Performance targets

### Skills Folder

**Index**: `skills/INDEX.md`
- Quick reference table (command, description, agent)
- Command categories
- Typical workflow examples
- Plugin list

**Per-Skill Format**:
- Command syntax and examples
- What it does (step-by-step)
- Output files
- Time targets
- Requirements
- Usage examples
- Troubleshooting
- Next steps
- Cross-references

### Config Folder

**Index**: `config/INDEX.md`
- Quick reference of config files

**mcp.md**:
- Overview of all MCP servers
- Detailed config per server
- Capabilities and restrictions
- Use cases
- Installation/setup
- Troubleshooting

**settings.md**:
- Project identity
- Workspace paths
- Tool configuration
- API settings
- TypeScript options
- Command timeouts
- Monitoring and logging
- Validation rules
- Performance limits

---

## Backup

Old JSON files preserved in `.claude/_archived/`:
- `agents.json`
- `skills.json`
- `mcp.json`
- `settings.json`

These can be referenced if needed, but the markdown versions are now primary.

---

## Usage

### Finding Agent Information

```bash
# Browse agents
ls .claude/agents/
cat .claude/agents/pipeline-orchestrator.md

# Or: Open in editor
code .claude/agents/
```

### Finding Skill Documentation

```bash
# Browse skills
ls .claude/skills/
cat .claude/skills/process-video.md

# Or: Quick reference
cat .claude/skills/INDEX.md
```

### Finding Configuration

```bash
# See MCP servers
cat .claude/config/mcp.md

# See project settings
cat .claude/config/settings.md
```

### Quick Reference

All INDEX.md files provide quick reference:
```bash
cat .claude/agents/INDEX.md      # Agent reference
cat .claude/skills/INDEX.md      # Command reference
cat .claude/config/INDEX.md      # Config overview
```

---

## Next Steps

1. ✅ Reorganization complete
2. ✅ All content migrated
3. ✅ Old JSON files archived
4. Review the new structure and cross-links
5. Update any external references to point to new files
6. Delete `_archived/` folder when confident

---

## Maintenance

### Adding a New Agent

1. Create `.claude/agents/new-agent.md`
2. Use existing agent as template
3. Update `agents/INDEX.md` with new entry

### Adding a New Skill

1. Create `.claude/skills/new-skill.md`
2. Use existing skill as template
3. Update `skills/INDEX.md` with new entry

### Updating Configuration

1. Edit relevant file in `config/`
2. Update both settings and any related agent files
3. Test changes with `/setup-env`

---

## Related Files

- `.claude/CLAUDE.md` — Project overview (unchanged)
- `.claude/agent-coordination.md` — Detailed agent workflows (unchanged)
- `.claude/remotion-guide.md` — Remotion techniques (unchanged)
- `.claude/commands/` — Command specifications (unchanged)

---

**Status**: ✅ Reorganization Complete

The `.claude` folder is now organized with markdown-based documentation, making it easier to navigate, search, and maintain. Enjoy!
