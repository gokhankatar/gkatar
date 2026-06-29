import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const LOG_DIR = join(homedir(), '.gkatar')
const LOG_FILE = join(LOG_DIR, 'gkatar.log')

export function ensureLogDir(): void {
  if (!existsSync(LOG_DIR)) {
    mkdirSync(LOG_DIR, { recursive: true })
  }
}

export function log(message: string): void {
  ensureLogDir()
  const timestamp = new Date().toISOString()
  appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`, 'utf8')
}

export function getLogPath(): string {
  return LOG_FILE
}

export function readLogs(): string {
  ensureLogDir()
  if (!existsSync(LOG_FILE)) return ''
  return readFileSync(LOG_FILE, 'utf8')
}

export function clearLogs(): void {
  ensureLogDir()
  writeFileSync(LOG_FILE, '', 'utf8')
}

export function getConfigDir(): string {
  ensureLogDir()
  return LOG_DIR
}
