import { runCmd, runPowerShell } from '../utils/exec.js'
import { title, success, warn } from '../utils/output.js'
import { log } from '../utils/logger.js'

export async function npmClean(): Promise<void> {
  title('npm Cache Temizle')
  try {
    const output = await runCmd('npm', ['cache', 'clean', '--force'])
    console.log(output)
    success('npm cache temizlendi')
    log('npm cache clean')
  } catch {
    warn('npm bulunamadı veya temizlik başarısız')
  }
}

export async function pnpmClean(): Promise<void> {
  title('pnpm Cache Temizle')
  try {
    const output = await runCmd('pnpm', ['store', 'prune'])
    console.log(output)
    success('pnpm cache temizlendi')
    log('pnpm store prune')
  } catch {
    warn('pnpm bulunamadı veya temizlik başarısız')
  }
}

export async function bunClean(): Promise<void> {
  title('bun Cache Temizle')
  try {
    const output = await runCmd('bun', ['pm', 'cache', 'rm'])
    console.log(output)
    success('bun cache temizlendi')
    log('bun pm cache rm')
  } catch {
    warn('bun bulunamadı veya temizlik başarısız')
  }
}

export async function dockerInfo(): Promise<void> {
  title('Docker Bilgisi')
  try {
    const output = await runCmd('docker', ['info', '--format', '{{json .}}'])
    const data = JSON.parse(output)
    console.log(`  Sürüm:     ${data.ServerVersion || data.ClientInfo?.Version || '-'}`)
    console.log(`  Container: ${data.Containers || 0}`)
    console.log(`  Image:     ${data.Images || 0}`)
    console.log(`  CPU:       ${data.NCPU || '-'}`)
    console.log(`  Memory:    ${data.MemTotal ? Math.round(data.MemTotal / 1024 / 1024 / 1024) + ' GB' : '-'}`)
  } catch {
    warn('Docker bulunamadı veya çalışmıyor')
  }
}

export async function dockerPrune(): Promise<void> {
  title('Docker Temizliği')
  try {
    const output = await runCmd('docker', ['system', 'prune', '-f'])
    console.log(output)
    success('Docker temizliği tamamlandı')
    log('docker system prune')
  } catch {
    warn('Docker bulunamadı veya temizlik başarısız')
  }
}
