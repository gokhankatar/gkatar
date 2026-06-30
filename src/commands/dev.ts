import { runCmd } from '../utils/exec.js'
import { title, success, warn, info, printTable } from '../utils/output.js'
import { log } from '../utils/logger.js'

interface GlobalPkg {
  name: string
  version: string
}

async function parseGlobalList(
  manager: string,
  args: string[]
): Promise<GlobalPkg[]> {
  try {
    const output = await runCmd(manager, args)
    const data = JSON.parse(output) as {
      dependencies?: Record<string, { version?: string }>
    }
    if (!data.dependencies) return []
    return Object.entries(data.dependencies).map(([name, meta]) => ({
      name,
      version: meta.version?.replace(/^v/, '') ?? '-'
    }))
  } catch {
    return []
  }
}

async function getNpmGlobalPackages(): Promise<GlobalPkg[]> {
  return parseGlobalList('npm', ['list', '-g', '--depth=0', '--json'])
}

async function getPnpmGlobalPackages(): Promise<GlobalPkg[]> {
  return parseGlobalList('pnpm', ['list', '-g', '--depth=0', '--json'])
}

async function getBunGlobalPackages(): Promise<GlobalPkg[]> {
  try {
    const output = await runCmd('bun', ['pm', 'ls', '-g'])
    const pkgs: GlobalPkg[] = []
    for (const line of output.split('\n')) {
      const match = line.trim().match(/^([@\w][\w./@-]*)\s+@?([\d.]+)/)
      if (match) pkgs.push({ name: match[1]!, version: match[2]! })
    }
    return pkgs
  } catch {
    return []
  }
}

async function getGlobalPrefix(manager: string): Promise<string | null> {
  try {
    return await runCmd(manager, ['prefix', '-g'])
  } catch {
    return null
  }
}

function printGlobalTable(manager: string, packages: GlobalPkg[], prefix: string | null): void {
  console.log(`\n  ${manager.toUpperCase()}${prefix ? ` (${prefix})` : ''}`)
  if (packages.length === 0) {
    info(`${manager} global paket bulunamadı`)
    return
  }
  printTable(
    ['Paket', 'Sürüm'],
    packages.sort((a, b) => a.name.localeCompare(b.name)).map((p) => [p.name, p.version])
  )
}

export async function showAllGlobal(): Promise<void> {
  title('Global Paketler', '📦')
  console.log(`  Node.js    ${process.version}`)

  const npmPrefix = await getGlobalPrefix('npm')
  const npmPkgs = await getNpmGlobalPackages()
  printGlobalTable('npm', npmPkgs, npmPrefix)

  const pnpmPrefix = await getGlobalPrefix('pnpm')
  const pnpmPkgs = await getPnpmGlobalPackages()
  if (pnpmPrefix || pnpmPkgs.length > 0) {
    printGlobalTable('pnpm', pnpmPkgs, pnpmPrefix)
  }

  const bunPkgs = await getBunGlobalPackages()
  if (bunPkgs.length > 0) {
    printGlobalTable('bun', bunPkgs, null)
  }

  log(`global: npm=${npmPkgs.length} pnpm=${pnpmPkgs.length}`)
}

export async function listNpmGlobal(): Promise<void> {
  title('npm Global Paketler', '📦')
  const prefix = await getGlobalPrefix('npm')
  if (prefix) console.log(`  Konum: ${prefix}`)
  const packages = await getNpmGlobalPackages()
  printGlobalTable('npm', packages, null)
  log(`npm global list: ${packages.length} packages`)
}

export async function listPnpmGlobal(): Promise<void> {
  title('pnpm Global Paketler', '📦')
  const prefix = await getGlobalPrefix('pnpm')
  if (prefix) console.log(`  Konum: ${prefix}`)
  const packages = await getPnpmGlobalPackages()
  printGlobalTable('pnpm', packages, null)
  log(`pnpm global list: ${packages.length} packages`)
}

export async function listBunGlobal(): Promise<void> {
  title('bun Global Paketler', '📦')
  const packages = await getBunGlobalPackages()
  printGlobalTable('bun', packages, null)
  log(`bun global list: ${packages.length} packages`)
}

export async function uninstallNpmGlobal(pkg: string): Promise<void> {
  title(`npm Global Kaldır: ${pkg}`, '🗑️')
  try {
    const output = await runCmd('npm', ['uninstall', '-g', pkg])
    if (output) console.log(output)
    success(`${pkg} global olarak kaldırıldı`)
    log(`npm uninstall -g ${pkg}`)
  } catch {
    warn(`Paket kaldırılamadı: ${pkg} (npm bulunamadı veya paket yok)`)
  }
}

export async function uninstallPnpmGlobal(pkg: string): Promise<void> {
  title(`pnpm Global Kaldır: ${pkg}`, '🗑️')
  try {
    const output = await runCmd('pnpm', ['uninstall', '-g', pkg])
    if (output) console.log(output)
    success(`${pkg} global olarak kaldırıldı`)
    log(`pnpm uninstall -g ${pkg}`)
  } catch {
    warn(`Paket kaldırılamadı: ${pkg} (pnpm bulunamadı veya paket yok)`)
  }
}

export async function uninstallBunGlobal(pkg: string): Promise<void> {
  title(`bun Global Kaldır: ${pkg}`, '🗑️')
  try {
    const output = await runCmd('bun', ['remove', '-g', pkg])
    if (output) console.log(output)
    success(`${pkg} global olarak kaldırıldı`)
    log(`bun remove -g ${pkg}`)
  } catch {
    warn(`Paket kaldırılamadı: ${pkg} (bun bulunamadı veya paket yok)`)
  }
}

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
