import pty from 'node-pty'
import os from 'os'
import path from 'path'

export function createPtyManager() {
  const shell = os.platform() === 'win32' ? 'powershell.exe' : process.env.SHELL || '/bin/zsh'

  return {
    spawn(command = 'claude', args = []) {
      const ptyProcess = pty.spawn(command, args, {
        name: 'xterm-256color',
        cols: 120,
        rows: 30,
        cwd: path.join(import.meta.dirname, '..'),
        env: {
          ...process.env,
          TERM: 'xterm-256color',
          COLORTERM: 'truecolor',
        },
      })

      return ptyProcess
    },
  }
}
