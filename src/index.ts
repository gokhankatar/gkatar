#!/usr/bin/env node

import { Command } from 'commander'
import { normalizeArgv } from './utils/aliases.js'
import { isWindows } from './utils/exec.js'
import { log } from './utils/logger.js'
import { error } from './utils/output.js'
import { clean, analyze, report } from './commands/clean.js'
import { info, disk, ram, cpu, gpu, hardware, uptime } from './commands/system-info.js'
import { listProcesses, searchProcess, killProcess } from './commands/process.js'
import { listPorts, checkPort, killPort } from './commands/ports.js'
import { network, ip, dns, ping } from './commands/network.js'
import { updateAll, search, install, uninstall, upgrade } from './commands/winget.js'
import { listStartup, disableStartup, enableStartup } from './commands/startup.js'
import { largest, find, size, tree } from './commands/files.js'
import { showLogs, clearGkatarLogs, events } from './commands/logs.js'
import { listServices, serviceAction } from './commands/services.js'
import { defender, firewall, env, path } from './commands/security.js'
import { npmClean, pnpmClean, bunClean, dockerInfo, dockerPrune } from './commands/dev.js'
import { showVersion, showHelp, uuid, password, hash, qr } from './commands/helpers.js'

async function run(fn: () => Promise<void> | void): Promise<void> {
  if (!isWindows()) {
    error('gkatar yalnızca Windows üzerinde çalışır.')
    process.exit(1)
  }

  try {
    await fn()
  } catch (err) {
    error(String(err))
    log(`error: ${err}`)
    process.exit(1)
  }
}

const program = new Command()

program
  .name('gkatar')
  .description('Windows terminal tabanlı sistem yönetim ve geliştirici araç kutusu')
  .version('1.0.0')

// ── Temizlik ──
program
  .command('clean [target]')
  .description('Sistem temizliği (temp, cache, prefetch, recycle, dns)')
  .action((target) => run(() => clean((target || 'all') as Parameters<typeof clean>[0])))

program.command('analyze').description('Temizlenebilir alan analizi').action(() => run(analyze))
program.command('report').description('Temizlik sonrası rapor').action(() => run(report))

// ── Sistem Bilgileri ──
program.command('info').description('Bilgisayar bilgileri').action(() => run(info))
program.command('disk').description('Disk bilgileri').action(() => run(disk))
program.command('ram').description('RAM bilgisi').action(() => run(ram))
program.command('cpu').description('CPU bilgisi').action(() => run(cpu))
program.command('gpu').description('GPU bilgisi').action(() => run(gpu))
program.command('hardware').description('Donanım özeti').action(() => run(hardware))
program.command('uptime').description('Çalışma süresi').action(() => run(uptime))

// ── Process ──
program
  .command('process [action] [query]')
  .description('İşlem yönetimi (search, kill)')
  .action((action, query) =>
    run(() => {
      if (!action) return listProcesses()
      if (action === 'search' && query) return searchProcess(query)
      if (action === 'kill' && query) return killProcess(query)
      if ((action === 'ara' || action === 'search') && query) return searchProcess(query)
      if ((action === 'kapat' || action === 'kill') && query) return killProcess(query)
      error('Kullanım: gkatar islem | gkatar islem ara <isim> | gkatar islem kapat <isim>')
      process.exit(1)
    })
  )

// ── Port ──
program.command('ports').description('Açık portları listele').action(() => run(listPorts))

program
  .command('port [action] [number]')
  .description('Port kontrol veya kapat (gkatar port 3000 | gkatar port kill 3000)')
  .action((action, number) =>
    run(() => {
      if (action === 'kill' && number) return killPort(parseInt(number, 10))
      if (action === 'kapat' && number) return killPort(parseInt(number, 10))
      if (action && !number) return checkPort(parseInt(action, 10))
      error('Kullanım: gkatar port <numara> | gkatar port kapat <numara>')
      process.exit(1)
    })
  )

// ── Network ──
program.command('network').description('Ağ bilgileri').action(() => run(network))
program.command('ip').description('IP adresi').action(() => run(ip))
program.command('dns').description('DNS bilgisi').action(() => run(dns))
program.command('ping <host>').description('Ping testi').action((host) => run(() => ping(host)))

// ── Winget ──
program.command('update').description('Tüm paketleri güncelle (winget upgrade --all)').action(() => run(updateAll))
program.command('search <query>').description('Paket ara').action((query) => run(() => search(query)))
program.command('install <pkg>').description('Paket yükle').action((pkg) => run(() => install(pkg)))
program.command('uninstall <pkg>').description('Paket kaldır').action((pkg) => run(() => uninstall(pkg)))
program.command('upgrade <pkg>').description('Paket güncelle').action((pkg) => run(() => upgrade(pkg)))

// ── Startup ──
program
  .command('startup [action] [name]')
  .description('Başlangıç programları (disable, enable)')
  .option('-c, --command <cmd>', 'Başlangıca eklenecek komut/yol')
  .action((action, name, opts) =>
    run(() => {
      if (!action) return listStartup()
      if ((action === 'disable' || action === 'kapat') && name) return disableStartup(name)
      if ((action === 'enable' || action === 'ac') && name) return enableStartup(name, opts.command)
      error('Kullanım: gkatar baslangic | gkatar baslangic kapat <isim> | gkatar baslangic ac <isim> -c "<komut>"')
      process.exit(1)
    })
  )

// ── Dosya Araçları ──
program.command('largest [dir]').description('Büyük dosyaları bul').action((dir) => run(() => largest(dir)))
program.command('find <pattern> [dir]').description('Dosya ara').action((pattern, dir) => run(() => find(pattern, dir)))
program.command('size <path>').description('Klasör boyutu hesapla').action((p) => run(() => size(p)))
program.command('tree <path>').description('Klasör ağacı göster').action((p) => run(() => tree(p)))

// ── Log ──
program
  .command('logs [action]')
  .description('Log sistemi')
  .action((action) =>
    run(() => {
      if (!action) return showLogs()
      if (action === 'clear' || action === 'temizle') return clearGkatarLogs()
      error('Kullanım: gkatar loglar | gkatar loglar temizle')
      process.exit(1)
    })
  )

program.command('events').description('Windows event log').action(() => run(events))

// ── Servisler ──
program.command('services').description('Servisleri listele').action(() => run(listServices))

program
  .command('service <action> <name>')
  .description('Servis yönetimi (start, stop, restart)')
  .action((action, name) => {
    const valid = ['start', 'stop', 'restart', 'baslat', 'durdur', 'yeniden'] as const
    const actionMap: Record<string, 'start' | 'stop' | 'restart'> = {
      start: 'start', baslat: 'start',
      stop: 'stop', durdur: 'stop',
      restart: 'restart', yeniden: 'restart'
    }
    const mapped = actionMap[action]
    if (!mapped) {
      error(`Geçersiz aksiyon: ${action}. Kullanım: baslat | durdur | yeniden`)
      process.exit(1)
    }
    return run(() => serviceAction(mapped, name))
  })

// ── Güvenlik / Sistem Araçları ──
program.command('defender').description('Defender durumu').action(() => run(defender))
program.command('firewall').description('Firewall durumu').action(() => run(firewall))
program.command('env').description('Environment değişkenleri').action(() => run(env))
program.command('path').description('PATH göster').action(() => run(path))

// ── Developer ──
program
  .command('npm [action]')
  .description('npm araçları')
  .action((action) => {
    if (action === 'clean' || action === 'temizle') return run(npmClean)
    error('Kullanım: gkatar npm temizle')
    process.exit(1)
  })

program
  .command('pnpm [action]')
  .description('pnpm araçları')
  .action((action) => {
    if (action === 'clean' || action === 'temizle') return run(pnpmClean)
    error('Kullanım: gkatar pnpm temizle')
    process.exit(1)
  })

program
  .command('bun [action]')
  .description('bun araçları')
  .action((action) => {
    if (action === 'clean' || action === 'temizle') return run(bunClean)
    error('Kullanım: gkatar bun temizle')
    process.exit(1)
  })

program
  .command('docker [action]')
  .description('Docker araçları')
  .action((action) => {
    if (!action) return run(dockerInfo)
    if (action === 'prune' || action === 'temizle') return run(dockerPrune)
    error('Kullanım: gkatar docker | gkatar docker temizle')
    process.exit(1)
  })

// ── Yardımcı ──
program.command('uuid').description('UUID üret').action(() => run(uuid))
program
  .command('password [length]')
  .description('Güvenli şifre üret')
  .action((length) => run(() => password(parseInt(length || '16', 10))))

program
  .command('hash <algorithm> <file>')
  .description('Dosya hash hesapla')
  .action((algorithm, file) => run(() => hash(algorithm, file)))

program.command('qr <text>').description('QR kod oluştur').action((text) => run(() => qr(text)))

// ── Genel ──
program.command('help').description('Yardım menüsü').action(() => showHelp())
program.command('version').description('Versiyon göster').action(() => showVersion())

if (process.argv.length <= 2) {
  showHelp()
} else {
  program.parse(normalizeArgv(process.argv))
}
