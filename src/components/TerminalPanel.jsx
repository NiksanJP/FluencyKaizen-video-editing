import { useEffect, useRef, useState } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'
import { pty } from '@/lib/api'

export default function TerminalPanel({ collapsed = false, onToggleCollapse, projectId }) {
  const containerRef = useRef(null)
  const termRef = useRef(null)
  const ptyIdRef = useRef(null)
  const fitAddonRef = useRef(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    const term = new XTerm({
      theme: {
        background: '#09090b',
        foreground: '#e4e4e7',
        cursor: '#a78bfa',
        selectionBackground: '#3b3b5c',
        black: '#09090b',
        red: '#ef4444',
        green: '#22c55e',
        yellow: '#eab308',
        blue: '#3b82f6',
        magenta: '#a855f7',
        cyan: '#06b6d4',
        white: '#e4e4e7',
        brightBlack: '#71717a',
        brightRed: '#f87171',
        brightGreen: '#4ade80',
        brightYellow: '#facc15',
        brightBlue: '#60a5fa',
        brightMagenta: '#c084fc',
        brightCyan: '#22d3ee',
        brightWhite: '#fafafa',
      },
      fontSize: 13,
      fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
      cursorBlink: true,
      cursorStyle: 'bar',
      allowTransparency: true,
      scrollback: 5000,
    })

    const fitAddon = new FitAddon()
    const webLinksAddon = new WebLinksAddon()

    term.loadAddon(fitAddon)
    term.loadAddon(webLinksAddon)
    term.open(containerRef.current)

    termRef.current = term
    fitAddonRef.current = fitAddon

    // Initial fit
    requestAnimationFrame(() => {
      try { fitAddon.fit() } catch {}
    })

    // Connect via IPC
    let removeOutputListener
    let removeExitListener

    ;(async () => {
      try {
        const id = await pty.spawn({ projectId })
        ptyIdRef.current = id
        setConnected(true)

        // Send initial size
        pty.resize(id, term.cols, term.rows)

        // Listen for output
        removeOutputListener = pty.onOutput((ptyId, data) => {
          if (ptyId === id) {
            term.write(data)
          }
        })

        // Listen for exit
        removeExitListener = pty.onExit((ptyId, exitCode) => {
          if (ptyId === id) {
            term.writeln(`\r\n\x1b[33mProcess exited with code ${exitCode}\x1b[0m`)
            setConnected(false)
          }
        })
      } catch {
        setConnected(false)
        term.writeln('\r\n\x1b[31mFailed to connect to terminal\x1b[0m')
      }
    })()

    // Send input to PTY
    term.onData((data) => {
      if (ptyIdRef.current) {
        pty.input(ptyIdRef.current, data)
      }
    })

    // Send resize events
    term.onResize(({ cols, rows }) => {
      if (ptyIdRef.current) {
        pty.resize(ptyIdRef.current, cols, rows)
      }
    })

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        try { fitAddon.fit() } catch {}
      })
    })
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
      if (removeOutputListener) removeOutputListener()
      if (removeExitListener) removeExitListener()
      if (ptyIdRef.current) pty.kill(ptyIdRef.current)
      term.dispose()
    }
  }, [])

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-zinc-800 bg-zinc-900/50">
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-0.5 rounded hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200 transition-colors"
            title={collapsed ? 'Expand terminal' : 'Collapse terminal'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {collapsed ? (
                <polyline points="15 18 9 12 15 6" />
              ) : (
                <polyline points="9 18 15 12 9 6" />
              )}
            </svg>
          </button>
        )}
        <div
          className={`h-2 w-2 rounded-full ${
            connected ? 'bg-foreground' : 'bg-muted-foreground'
          }`}
        />
        <span className="text-xs font-medium text-zinc-400">Claude Code</span>
      </div>

      {/* Terminal */}
      {!collapsed && <div ref={containerRef} className="flex-1 min-h-0 p-1" />}
    </div>
  )
}
