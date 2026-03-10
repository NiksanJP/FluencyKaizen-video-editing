#!/usr/bin/env python3
"""
Minimal PTY bridge: spawns argv[1:] inside a real pseudo-terminal,
piping the PTY's I/O through stdin/stdout so Bun.spawn can interact
with interactive CLI tools (claude, aider) over regular pipes.
"""
import pty, sys, os

if len(sys.argv) < 2:
    print("Usage: pty-bridge.py <command> [args...]", file=sys.stderr)
    sys.exit(1)

# Set TERM if not already set
os.environ.setdefault("TERM", "xterm-256color")

# pty.spawn handles the fork, copying data between PTY master and stdin/stdout
exit_code = pty.spawn(sys.argv[1:])
sys.exit(exit_code if isinstance(exit_code, int) else 0)
