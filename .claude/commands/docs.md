# /docs

Open, view, or update project documentation files.

## Usage

```
/docs                    # Show documentation overview and progress
/docs <filename>         # Show specific doc (discovery, plan, prd, problem, progress, research)
/docs update <filename>  # Update a specific doc with current project state
```

## Parameters

- `filename` (optional): One of `discovery`, `plan`, `prd`, `problem`, `progress`, `research`
- `update` (optional): Flag to update the doc with latest information from codebase

## Implementation

1. If no arguments: read and display `docs/progress.md` as overview
2. If filename given: read and display `docs/<filename>.md`
3. If `update` flag:
   - Scan relevant source files for changes
   - Update the specified doc file with current state
   - Show diff of changes made

## Files

All documentation lives in `docs/`:

| File | Purpose |
|------|---------|
| `docs/discovery.md` | Architecture decisions, data flow, integration notes |
| `docs/plan.md` | Implementation roadmap, milestones, priorities |
| `docs/prd.md` | Product requirements document |
| `docs/problem.md` | Known issues, tech debt, bugs |
| `docs/progress.md` | Build checklist — done vs in-progress vs planned |
| `docs/research.md` | Tool benchmarks, research notes |

## Notes

- All agents should update relevant docs when making significant changes
- See `docs/CLAUDE.md` for per-folder context
