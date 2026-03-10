#!/usr/bin/env python3
"""
Minimal PTY bridge: spawns argv[1:] inside a real pseudo-terminal,
piping the PTY's I/O through stdin/stdout so Bun.spawn can interact
with interactive CLI tools (claude, aider) over regular pipes.

Handles signals gracefully to prevent unexpected disconnections.
"""
import pty, sys, os, signal

if len(sys.argv) < 2:
    print("Usage: pty-bridge.py <command> [args...]", file=sys.stderr)
    sys.exit(1)

# Set TERM if not already set
os.environ.setdefault("TERM", "xterm-256color")

# Ignore SIGHUP so the bridge doesn't die when the parent terminal disconnects.
# The child process will receive its own SIGHUP from the PTY closing.
signal.signal(signal.SIGHUP, signal.SIG_IGN)

# Disable stdout buffering so output reaches Bun immediately
sys.stdout = os.fdopen(sys.stdout.fileno(), 'wb', 0)

# pty.spawn handles the fork, copying data between PTY master and stdin/stdout
exit_code = pty.spawn(sys.argv[1:])
sys.exit(exit_code if isinstance(exit_code, int) else 0)
