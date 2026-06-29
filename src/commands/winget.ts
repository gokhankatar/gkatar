import { runCmd } from '../utils/exec.js'
import { title, success, warn } from '../utils/output.js'
import { log } from '../utils/logger.js'

async function winget(args: string[]): Promise<string> {
  return runCmd('winget', args)
}

export async function updateAll(): Promise<void> {
  title('Tüm Paketleri Güncelle')
  console.log('winget upgrade --all çalıştırılıyor...\n')
  const output = await winget(['upgrade', '--all', '--accept-package-agreements', '--accept-source-agreements'])
  console.log(output)
  log('winget: upgrade --all')
  success('Güncelleme tamamlandı')
}

export async function search(query: string): Promise<void> {
  title(`Paket Ara: ${query}`)
  const output = await winget(['search', query])
  console.log(output)
}

export async function install(pkg: string): Promise<void> {
  title(`Paket Yükle: ${pkg}`)
  const output = await winget(['install', pkg, '--accept-package-agreements', '--accept-source-agreements'])
  console.log(output)
  log(`winget install: ${pkg}`)
  success(`${pkg} yükleme işlemi tamamlandı`)
}

export async function uninstall(pkg: string): Promise<void> {
  title(`Paket Kaldır: ${pkg}`)
  const output = await winget(['uninstall', pkg, '--accept-source-agreements'])
  console.log(output)
  log(`winget uninstall: ${pkg}`)
  success(`${pkg} kaldırma işlemi tamamlandı`)
}

export async function upgrade(pkg: string): Promise<void> {
  title(`Paket Güncelle: ${pkg}`)
  const output = await winget(['upgrade', pkg, '--accept-package-agreements', '--accept-source-agreements'])
  console.log(output)
  log(`winget upgrade: ${pkg}`)
  success(`${pkg} güncelleme işlemi tamamlandı`)
}
