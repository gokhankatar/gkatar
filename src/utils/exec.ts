import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { platform } from 'node:os'

const execFileAsync = promisify(execFile)

export function isWindows(): boolean {
  return platform() === 'win32'
}

export async function runPowerShell(script: string, options?: { silent?: boolean }): Promise<string> {
  if (!isWindows()) {
    throw new Error('gkatar yalnızca Windows üzerinde çalışır.')
  }

  const { stdout, stderr } = await execFileAsync(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script],
    { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }
  )

  if (stderr && !options?.silent) {
    const trimmed = stderr.trim()
    if (trimmed && !trimmed.startsWith('WARNING:')) {
      console.warn(trimmed)
    }
  }

  return stdout.trim()
}

export async function runCmd(command: string, args: string[] = []): Promise<string> {
  const { stdout, stderr } = await execFileAsync(command, args, {
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
    shell: false
  })

  if (stderr?.trim()) {
    console.warn(stderr.trim())
  }

  return stdout.trim()
}

export async function runShell(command: string): Promise<string> {
  const { stdout, stderr } = await execFileAsync(command, [], {
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
    shell: true
  })

  if (stderr?.trim()) {
    console.warn(stderr.trim())
  }

  return stdout.trim()
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = bytes / Math.pow(1024, i)
  return `${value.toFixed(i > 0 ? 2 : 0)} ${units[i]}`
}

export function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  const parts: string[] = []
  if (days > 0) parts.push(`${days} gün`)
  if (hours > 0) parts.push(`${hours} saat`)
  if (minutes > 0) parts.push(`${minutes} dk`)
  if (secs > 0 || parts.length === 0) parts.push(`${secs} sn`)

  return parts.join(', ')
}
