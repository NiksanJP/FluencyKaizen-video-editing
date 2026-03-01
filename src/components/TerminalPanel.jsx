import { useEffect, useRef, useState } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'

export default function TerminalPanel() {
  const containerRef = useRef(null)
  const termRef = useRef(null)
  const wsRef = useRef(null)
  const fitAddonRef = useRef(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    const term = new XTerm({
      theme: {
        background: '#0a0a0f',
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

    // Connect WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.hostname}:3001/ws`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      // Send initial size
      ws.send(JSON.stringify({
        type: 'resize',
        cols: term.cols,
        rows: term.rows,
      }))
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'output') {
          term.write(msg.data)
        } else if (msg.type === 'exit') {
          term.writeln(`\r\n\x1b[33mProcess exited with code ${msg.exitCode}\x1b[0m`)
          setConnected(false)
        }
      } catch {}
    }

    ws.onclose = () => {
      setConnected(false)
      term.writeln('\r\n\x1b[31mDisconnected from terminal\x1b[0m')
    }

    ws.onerror = () => {
      setConnected(false)
      term.writeln('\r\n\x1b[31mFailed to connect to terminal server\x1b[0m')
    }

    // Send input to PTY
    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input', data }))
      }
    })

    // Send resize events
    term.onResize(({ cols, rows }) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', cols, rows }))
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
      ws.close()
      term.dispose()
    }
  }, [])

  return (
    <div className="h-full flex flex-col bg-[#0a0a0f]">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-zinc-800 bg-zinc-900/50">
        <div
          className={`h-2 w-2 rounded-full ${
            connected ? 'bg-green-500' : 'bg-zinc-500'
          }`}
        />
        <span className="text-xs font-medium text-zinc-400">Claude Code</span>
      </div>

      {/* Terminal */}
      <div ref={containerRef} className="flex-1 min-h-0 p-1" />
    </div>
  )
}
