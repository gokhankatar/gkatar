import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { readFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import chalk from 'chalk'
import gradient from 'gradient-string'
import qrcode from 'qrcode-terminal'
import { banner, box, cmd, section, title } from '../utils/output.js'

const require = createRequire(import.meta.url)
const { version } = require('../../package.json') as { version: string }

const brand = gradient(['#00d4ff', '#7b2ff7', '#f107a3'])

export function showVersion(): void {
  banner()
  box(
    `${brand('gkatar')} ${chalk.white.bold(`v${version}`)}\n` +
      `${chalk.gray('Geliştirici:')} ${chalk.white('Gökhan Katar')}\n` +
      `${chalk.gray('Platform:')}   ${chalk.white('Windows 10/11')}\n` +
      `${chalk.gray('Node:')}       ${chalk.white(process.version)}`,
    '📦 Versiyon'
  )
}

export function uuid(): void {
  title('UUID Oluşturucu', '🆔')
  box(randomUUID(), 'Yeni UUID')
}

export function password(length = 16): void {
  title(`Güvenli Şifre (${length} karakter)`, '🔐')
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*-_=+'
  const bytes = randomBytes(length)
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i]! % chars.length]
  }
  box(result, 'Şifren')
}

export function hash(algorithm: string, filePath: string): void {
  title(`Hash: ${algorithm}`, '#️⃣')
  if (!existsSync(filePath)) {
    box(`Dosya bulunamadı:\n${filePath}`, '❌ Hata')
    return
  }
  const data = readFileSync(filePath)
  const hashValue = createHash(algorithm).update(data).digest('hex')
  box(`${chalk.cyan(algorithm)}: ${hashValue}\n${chalk.gray('Dosya:')} ${filePath}`, 'Hash Sonucu')
}

export function qr(text: string): void {
  title('QR Kod', '📱')
  qrcode.generate(text, { small: true })
  console.log(chalk.gray(`\n  ${text}\n`))
}

const COMMANDS = [
  {
    icon: '🧹',
    name: 'TEMİZLİK',
    items: [
      ['temizle / clean [hedef]', 'Sistem temizliği (gecici, onbellek, prefetch, geri-donusum, dns)'],
      ['analiz / analyze', 'Temizlenebilir alan analizi'],
      ['rapor / report', 'Disk ve sistem raporu']
    ]
  },
  {
    icon: '💻',
    name: 'SİSTEM',
    items: [
      ['bilgi / info', 'Bilgisayar bilgileri'],
      ['disk', 'Disk bilgileri'],
      ['bellek / ram', 'RAM kullanımı'],
      ['islemci / cpu', 'CPU bilgisi'],
      ['ekrankarti / gpu', 'GPU bilgisi'],
      ['donanim / hardware', 'Donanım özeti'],
      ['calisma-suresi / uptime', 'Çalışma süresi']
    ]
  },
  {
    icon: '⚙️',
    name: 'İŞLEM & PORT',
    items: [
      ['islem / process', 'Çalışan işlemler'],
      ['islem ara chrome', 'İşlem ara'],
      ['islem kapat chrome', 'İşlem kapat'],
      ['portlar / ports', 'Açık portları listele'],
      ['port 3000', 'Port kontrol'],
      ['port kapat 3000', 'Portu kullanan işlemi kapat']
    ]
  },
  {
    icon: '🌐',
    name: 'AĞ',
    items: [
      ['ag / network', 'Ağ adaptörleri'],
      ['ip', 'IP adresi'],
      ['dns', 'DNS sunucuları'],
      ['ping google.com', 'Ping testi']
    ]
  },
  {
    icon: '📦',
    name: 'WINGET',
    items: [
      ['guncelle / update', 'Tüm paketleri güncelle'],
      ['ara / search vscode', 'Paket ara'],
      ['yukle / install vscode', 'Paket yükle'],
      ['kaldir / uninstall vscode', 'Paket kaldır'],
      ['yukselt / upgrade vscode', 'Paket güncelle']
    ]
  },
  {
    icon: '🚀',
    name: 'BAŞLANGIÇ',
    items: [
      ['baslangic / startup', 'Başlangıç uygulamaları'],
      ['baslangic kapat discord', 'Başlangıçtan kapat'],
      ['baslangic ac discord -c "yol"', 'Başlangıca ekle']
    ]
  },
  {
    icon: '📁',
    name: 'DOSYA',
    items: [
      ['buyuk / largest [klasör]', 'En büyük dosyalar'],
      ['bul / find "*.log"', 'Dosya ara'],
      ['boyut / size C:\\Users', 'Klasör boyutu'],
      ['agac / tree C:\\Projects', 'Klasör ağacı']
    ]
  },
  {
    icon: '📜',
    name: 'LOG & SERVİS',
    items: [
      ['loglar / logs', 'gkatar logları'],
      ['loglar temizle', 'Logları temizle'],
      ['olaylar / events', 'Windows event log'],
      ['servisler / services', 'Servisleri listele'],
      ['servis baslat spooler', 'Servis başlat'],
      ['servis durdur spooler', 'Servis durdur'],
      ['servis yeniden spooler', 'Servis yeniden başlat']
    ]
  },
  {
    icon: '🔐',
    name: 'GÜVENLİK',
    items: [
      ['koruma / defender', 'Windows Defender'],
      ['guvenlikduvari / firewall', 'Firewall durumu'],
      ['ortam / env', 'Ortam değişkenleri'],
      ['yol / path', 'PATH değişkeni']
    ]
  },
  {
    icon: '👨‍💻',
    name: 'GELİŞTİRİCİ',
    items: [
      ['global', 'Tüm global paketleri listele (npm, pnpm, bun)'],
      ['global kaldir vue-cli', 'Global paket kaldır'],
      ['npm global', 'npm global paketleri listele'],
      ['npm kaldir vue-cli', 'npm global paket kaldır'],
      ['npm temizle', 'npm cache temizle'],
      ['pnpm global', 'pnpm global paketleri listele'],
      ['pnpm temizle', 'pnpm cache temizle'],
      ['bun global', 'bun global paketleri listele'],
      ['bun temizle', 'bun cache temizle'],
      ['docker', 'Docker bilgisi'],
      ['docker temizle', 'Docker prune']
    ]
  },
  {
    icon: '🔧',
    name: 'YARDIMCI',
    items: [
      ['uuid', 'UUID üret'],
      ['sifre / password 32', 'Güvenli şifre'],
      ['hash sha256 dosya.zip', 'Dosya hash'],
      ['qr "https://github.com"', 'QR kod oluştur']
    ]
  },
  {
    icon: '📋',
    name: 'GENEL',
    items: [
      ['yardim / help', 'Bu menü'],
      ['surum / version', 'Versiyon bilgisi']
    ]
  }
]

export function showHelp(): void {
  banner()

  box(
    `${chalk.white('Kullanım:')} ${cmd('gkatar')} ${chalk.gray('<komut>')} ${chalk.gray('[seçenekler]')}\n\n` +
      `${chalk.gray('Tüm komutlar hem ')}${chalk.cyan('Türkçe')}${chalk.gray(' hem ')}${chalk.cyan('İngilizce')}${chalk.gray(' kullanılabilir.')}`,
    '💡 Başlangıç'
  )

  for (const group of COMMANDS) {
    section(`${group.icon} ${group.name}`)
    for (const [command, desc] of group.items) {
      console.log(`  ${cmd(command.padEnd(36))} ${chalk.gray(desc)}`)
    }
  }

  console.log(
    chalk.gray('\n  💬 Örnek: ') +
      cmd('gkatar temizle gecici') +
      chalk.gray(' · ') +
      cmd('gkatar bilgi') +
      chalk.gray(' · ') +
      cmd('gkatar port kapat 3000') +
      '\n'
  )
}
