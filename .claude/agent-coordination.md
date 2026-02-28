# Agent Coordination Guide

## Overview

The FluencyKaizen project uses a **multi-agent collaborative framework** where specialized Claude Agents work together to accomplish complex video production tasks. This guide explains how agents coordinate and communicate.

---

## Agent Team

### 1. Pipeline Orchestrator Agent
**Role**: Master coordinator of the video processing pipeline

**Responsibilities**:
- Orchestrate Whisper transcription
- Call Gemini API for content analysis
- Generate and save clip.json
- Manage overall workflow state
- Track errors and call Error Handler when needed

**When activated**: `/process-video <filename>`

**Collaborations**:
- Calls: Schema Validator (validate output)
- Calls: Error Handler (on failures)
- Provides: clip.json to other agents

**Example flow**:
```
User: /process-video business.mp4
  ↓
Pipeline Orchestrator
  ├─ Extract audio with FFmpeg
  ├─ Run Whisper transcription
  ├─ Send to Gemini API
  ├─ Call Schema Validator: "Check this clip.json"
  └─ Write output/business/clip.json
     ↓ Result goes to Clip Editor for editing
```

---

### 2. Remotion Composer Agent
**Role**: Master of video composition and rendering

**Responsibilities**:
- Manage Remotion Studio
- Calculate frame ranges from timestamps
- Render compositions to MP4
- Handle visual component state
- Optimize rendering performance

**When activated**: `/render`, `/preview`

**Collaborations**:
- Calls: Performance Optimizer (optimize render settings)
- Calls: Error Handler (on render failures)
- Receives: clip.json from Clip Editor
- Needs: Source video in remotion/public/

**Example flow**:
```
User: /render business
  ↓
Remotion Composer
  ├─ Load output/business/clip.json
  ├─ Copy to remotion/public/clip.json
  ├─ Copy source video to remotion/public/
  ├─ Call Performance Optimizer: "Suggest render settings"
  ├─ Render ClipComposition with optimized settings
  └─ Save output/business/render.mp4
```

---

### 3. Clip Editor Agent
**Role**: Interprets natural language and modifies clip data

**Responsibilities**:
- Parse clip.json
- Understand natural language edit instructions
- Apply semantic changes (move clip, change title, adjust timing)
- Pre-validate changes
- Communicate impact to other agents

**When activated**: `/edit-clip <video-name>`

**Collaborations**:
- Calls: Schema Validator (validate edited clip)
- Communicates with: Remotion Composer (preview impact)
- Receives: clip.json from output folder
- Provides: Updated clip.json back to output folder

**Example flow**:
```
User: /edit-clip business
User: "Move the first vocab card start time from 5s to 10s"
  ↓
Clip Editor
  ├─ Read output/business/clip.json
  ├─ Find first vocab card (trigger at 5s)
  ├─ Update triggerTime to 10
  ├─ Call Schema Validator: "Check this change"
  │  ├─ Validator confirms: timing is valid
  │  └─ Validator: "Vocab card now appears 5 seconds later"
  ├─ Write updated output/business/clip.json
  └─ Suggest to Remotion Composer: "Preview to see new timing"
```

---

### 4. Schema Validator Agent
**Role**: Ensures data integrity and spec compliance

**Responsibilities**:
- Validate ClipData structure
- Check subtitle segment coverage (no gaps)
- Verify highlight words exist in text
- Validate timestamp formats
- Check clip duration (30-60s rule)
- Generate detailed validation reports

**When activated**: `/validate-clip <video-name>` (or automatically)

**Collaborations**:
- Receives: clip.json from Pipeline Orchestrator or Clip Editor
- Reports to: Calling agent or Error Handler
- Can be called by: Any agent that modifies clip.json

**Example flow**:
```
Pipeline Orchestrator: "Here's the clip.json I generated, please validate"
  ↓
Schema Validator
  ├─ Check structure ✓ (all fields present)
  ├─ Check clip duration ✓ (45.5s, within 30-60s)
  ├─ Check subtitles ✓ (coverage 0-45.5s, no gaps)
  ├─ Check highlights ✓ (all words found in Japanese text)
  ├─ Check vocab cards ✓ (all fields present, no conflicts)
  └─ Report: "✅ Validation passed"
     └─ Pipeline Orchestrator proceeds to save
```

Or if invalid:
```
Clip Editor: "I edited the subtitles, please validate"
  ↓
Schema Validator
  ├─ Check subtitles ❌ (gap detected: 15.2-16.1s has no caption)
  ├─ Check highlights ❌ ("phrase" not found in Japanese: "別の表現を選んでください")
  └─ Report: "❌ 2 validation errors"
     └─ Clip Editor fixes and retries
```

---

### 5. Error Handler Agent
**Role**: Manages failures and provides recovery solutions

**Responsibilities**:
- Catch exceptions from any agent
- Parse error messages
- Suggest remediation steps
- Manage retries intelligently
- Log and document issues
- Provide troubleshooting guidance

**When activated**: Automatically on any error

**Collaborations**:
- Receives errors from: All other agents
- Calls: Schema Validator (if validation failed)
- Provides: Hints to calling agent for retry

**Example flow**:
```
Pipeline Orchestrator: ffmpeg -i source.mp4 ... → FAILS
  ↓
Error Handler catches: "ffmpeg: not found"
  ├─ Recognize: "System tool missing"
  ├─ Suggest: "Install ffmpeg: brew install ffmpeg"
  ├─ Offer to: Help troubleshoot or escalate to Setup Manager
  └─ Log: "ffmpeg-error-2026-02-27.log"

User fixes error (installs ffmpeg)
  ↓
User retries: /process-video business.mp4
  ↓
Pipeline Orchestrator succeeds
```

Or if Gemini API fails:
```
Gemini API: { error: "INVALID_ARGUMENT" }
  ↓
Error Handler catches
  ├─ Recognize: "API error"
  ├─ Check: GEMINI_API_KEY is set and valid
  ├─ Suggest: "Check .env file, regenerate API key if needed"
  └─ Offer: Retry with exponential backoff (3x)
```

---

### 6. Performance Optimizer Agent
**Role**: Monitors and optimizes resource usage

**Responsibilities**:
- Monitor CPU/memory during operations
- Analyze render times and bottlenecks
- Suggest caching strategies
- Recommend parameter tuning
- Generate performance reports

**When activated**: `/test-pipeline`, automatically on long operations

**Collaborations**:
- Calls: Performance Optimizer when rendering
- Receives performance data from: Remotion Composer
- Provides: Optimization suggestions

**Example flow**:
```
Remotion Composer: "I'm about to render a 60-second clip"
  ↓
Performance Optimizer
  ├─ Analyze system: 4 CPU cores, 8GB RAM
  ├─ Estimate render time: 3.5 minutes
  ├─ Suggest settings:
  │  ├─ codec: "h264" (balanced)
  │  ├─ crf: "18" (good quality)
  │  ├─ parallel: "4" (use all cores)
  │  └─ cache: "enabled"
  └─ Report: "Should complete in ~3.5 min, 2.5GB disk needed"
     ↓
Remotion Composer: Proceeds with suggested settings
```

---

### 7. Documentation Curator Agent
**Role**: Maintains project documentation

**Responsibilities**:
- Update documentation files
- Maintain schema reference
- Create examples and guides
- Track changes and updates
- Generate reports

**When activated**: On demand, updates docs as needed

**Collaborations**:
- Receives: Updates from other agents
- Provides: Reference material to all agents
- Maintains: Consistency across documentation

---

### 8. Setup Manager Agent
**Role**: Manages environment initialization

**Responsibilities**:
- Verify system tools (ffmpeg, whisper, bun)
- Check dependencies
- Manage environment variables
- Run setup scripts
- Generate setup reports

**When activated**: `/setup-env`

**Collaborations**:
- Calls: Error Handler (if tool missing)
- Provides: Environment report to other agents

**Example flow**:
```
User: /setup-env
  ↓
Setup Manager
  ├─ Check bun: ✓ v1.0.14
  ├─ Check ffmpeg: ✓ v6.0
  ├─ Check whisper: ✓ v20240301
  ├─ Check Python: ✓ 3.11.7
  ├─ Check .env: ✓ GEMINI_API_KEY set
  ├─ Install npm packages: ✓ (bun install)
  ├─ Download Whisper models: ✓ (base.pt, 140MB)
  └─ Report: "✅ Environment ready"
     ↓
All agents ready to proceed
```

---

### 9. Test Coordinator Agent
**Role**: Runs integration tests and QA

**Responsibilities**:
- Run unit tests
- Execute integration tests
- Validate end-to-end workflows
- Generate test reports
- Suggest optimizations

**When activated**: `/test-pipeline`

**Collaborations**:
- Calls: All other agents in parallel
- Provides: Test results and recommendations

**Example flow**:
```
User: /test-pipeline
  ↓
Test Coordinator (launches parallel tests)
  ├─ Calls: Pipeline Orchestrator → "Test transcription"
  ├─ Calls: Remotion Composer → "Test rendering"
  ├─ Calls: Schema Validator → "Test validation"
  ├─ Calls: Clip Editor → "Test editing"
  └─ Waits for all to complete...
     ↓
Results aggregated:
  ✓ Pipeline Orchestrator: 3/3 tests passed
  ✓ Remotion Composer: 2/2 tests passed
  ✓ Schema Validator: 6/6 tests passed
  ✓ Clip Editor: 4/4 tests passed
  ✓ Overall: 15/15 tests passed ✅
```

---

## Collaboration Patterns

### Pattern 1: Sequential Pipeline (Most Common)
```
Task Start
  ↓
Primary Agent
  ├─ Does main work
  ├─ Calls validator (if state changes)
  ├─ On error → Error Handler
  └─ Reports result
     ↓
Task Complete
```

**Used by**: `/process-video`, `/render`, `/edit-clip`

**Benefits**:
- Simple, predictable flow
- One agent responsible per step
- Easy to debug
- Clear error accountability

---

### Pattern 2: Cooperative Workflow (Complex Tasks)
```
Task Start
  ↓
Agent A (primary)
  ├─ Does work
  ├─ Communicates: "Here's what I'm doing"
  ├─ Calls: Agent B (validate)
  ├─ Receives: Agent B feedback
  ├─ Adjusts if needed
  ├─ Communicates: Agent C (preview impact)
  └─ Finalizes
     ↓
Task Complete
```

**Used by**: `/edit-clip` (Editor ↔ Validator ↔ Composer)

**Benefits**:
- Agents share decision-making
- Better error detection early
- Collaborative problem solving
- Higher quality outputs

---

### Pattern 3: Parallel Execution (Testing & Optimization)
```
Task Start
  ↓
Coordinator Agent
  ├─ Launches: Agent A (independent task)
  ├─ Launches: Agent B (independent task)
  ├─ Launches: Agent C (independent task)
  └─ Waits for all to complete...
     ↓
Aggregates results
  ↓
Task Complete
```

**Used by**: `/test-pipeline`

**Benefits**:
- Much faster for independent tasks
- All tests run simultaneously
- Better resource utilization
- Comprehensive testing

---

## Communication Between Agents

### Message Format (Internal)
```json
{
  "from": "pipeline-orchestrator",
  "to": "schema-validator",
  "action": "validate",
  "payload": {
    "clipData": { ... },
    "strict": true
  },
  "requestId": "req-123456",
  "timestamp": "2026-02-27T10:15:30Z"
}
```

### Response Format
```json
{
  "from": "schema-validator",
  "to": "pipeline-orchestrator",
  "action": "validate",
  "status": "success",
  "payload": {
    "valid": true,
    "errors": [],
    "warnings": [],
    "report": "✅ Validation passed"
  },
  "requestId": "req-123456",
  "timestamp": "2026-02-27T10:15:30Z"
}
```

### Error Communication
```json
{
  "from": "remotion-composer",
  "to": "error-handler",
  "action": "handle_error",
  "payload": {
    "error": "staticFile not found: source.mp4",
    "code": "FILE_NOT_FOUND",
    "context": "/render task",
    "originalAgent": "remotion-composer"
  },
  "requestId": "req-789012",
  "timestamp": "2026-02-27T10:15:35Z"
}
```

---

## Task Routing Map

```
User Command → Primary Agent → Secondary Agents → Output
───────────────────────────────────────────────────────

/process-video
  → Pipeline Orchestrator
    → [Schema Validator, Error Handler if needed]
    → output/[name]/clip.json

/render
  → Remotion Composer
    → [Performance Optimizer, Error Handler if needed]
    → output/[name]/render.mp4

/preview
  → Remotion Composer
    → [Error Handler if needed]
    → Launch studio on http://localhost:3000

/edit-clip
  → Clip Editor
    → [Schema Validator, Error Handler if needed]
    → output/[name]/clip.json (modified)

/validate-clip
  → Schema Validator
    → [Error Handler if needed]
    → Validation report

/test-pipeline
  → Test Coordinator
    → [All agents in parallel]
    → Test results & recommendations

/setup-env
  → Setup Manager
    → [Error Handler if missing tools]
    → Environment ready confirmation
```

---

## Error Recovery Flow

```
Any Agent encounters error
  ↓
Catch exception and halt
  ↓
Send to Error Handler:
  {
    "error": "...",
    "context": "...",
    "recoverable": true/false
  }
  ↓
Error Handler analyzes:
  ├─ Is it a known error? → Suggest fix
  ├─ Is it recoverable? → Attempt retry
  ├─ Is it critical? → Escalate & log
  └─ Need dependencies? → Call Setup Manager
     ↓
Report to calling agent:
  {
    "suggested_action": "...",
    "can_retry": true/false,
    "details": "..."
  }
     ↓
Calling agent decides: retry or report to user
```

---

## Logging & Monitoring

All agent activity is logged:

```
.claude/logs/
├── agents/
│   ├── pipeline-orchestrator.log
│   ├── remotion-composer.log
│   ├── clip-editor.log
│   ├── schema-validator.log
│   ├── error-handler.log
│   ├── performance-optimizer.log
│   ├── documentation-curator.log
│   ├── setup-manager.log
│   └── test-coordinator.log
├── claude.log              # Main Claude Code log
├── errors.log              # Critical errors
└── coordination.log        # Agent-to-agent communication
```

Monitor agent communication:
```bash
tail -f .claude/logs/coordination.log
```

Debug specific agent:
```bash
grep "pipeline-orchestrator" .claude/logs/*.log
```

---

## Performance Metrics

Each agent tracks:
- **Execution time** — How long tasks take
- **Error rate** — How often failures occur
- **Resource usage** — CPU, memory, disk
- **Success rate** — Percentage of successful operations

View metrics:
```bash
cat .claude/logs/agents/performance-metrics.json
```

---

## Best Practices for Agent Collaboration

### ✅ Do
- Trust agents to do their job within their scope
- Let Error Handler handle exceptions
- Call Schema Validator before finalizing changes
- Use parallel execution for independent tasks
- Log all significant operations

### ❌ Don't
- Call agents in the wrong order (follow task routing map)
- Modify clip.json without validation
- Skip error handling
- Assume agents communicate directly (they don't)
- Ignore validation warnings

---

## Troubleshooting Agent Issues

### "Agent X didn't respond"
```
Check: .claude/logs/agents/[agent-name].log
Look for: Timeout, crash, or deadlock
Action: Restart agent via main CLI or restart session
```

### "Agents giving conflicting advice"
```
Check: Task routing map above
Verify: Only one primary agent per task
Review: Agent collaboration logs
```

### "Performance degradation"
```
Check: .claude/logs/agents/performance-metrics.json
Run: /test-pipeline (to diagnose bottlenecks)
Call: Performance Optimizer for recommendations
```

---

## Configuration Files

Agent behavior is configured in:

- **`.claude/agents.json`** — Agent definitions and collaborations
- **`.claude/settings.json`** — Global Claude Code settings
- **`.claude/mcp.json`** — MCP server configurations
- **`.claude/skills.json`** — Skill definitions for agents

Edit these files to:
- Add new agents
- Change collaboration patterns
- Adjust timeouts and limits
- Reconfigure tool access

---

## Summary

**Multi-agent coordination enables**:
- ✅ Reliable video processing (Pipeline Orchestrator)
- ✅ Professional rendering (Remotion Composer)
- ✅ Natural language editing (Clip Editor)
- ✅ Data integrity (Schema Validator)
- ✅ Graceful error handling (Error Handler)
- ✅ Optimized performance (Performance Optimizer)
- ✅ Current documentation (Documentation Curator)
- ✅ Ready environment (Setup Manager)
- ✅ Comprehensive testing (Test Coordinator)

**All agents work together seamlessly to deliver professional short-form video production.**
