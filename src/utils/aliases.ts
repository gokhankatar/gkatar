/** Türkçe komut → İngilizce dahili komut eşlemesi */

const MAIN_COMMANDS: Record<string, string> = {
  temizle: 'clean',
  analiz: 'analyze',
  rapor: 'report',
  bilgi: 'info',
  bellek: 'ram',
  islemci: 'cpu',
  ekrankarti: 'gpu',
  gpu: 'gpu',
  donanim: 'hardware',
  'calisma-suresi': 'uptime',
  islem: 'process',
  portlar: 'ports',
  ag: 'network',
  guncelle: 'update',
  ara: 'search',
  yukle: 'install',
  kaldir: 'uninstall',
  yukselt: 'upgrade',
  baslangic: 'startup',
  buyuk: 'largest',
  bul: 'find',
  boyut: 'size',
  agac: 'tree',
  loglar: 'logs',
  olaylar: 'events',
  servisler: 'services',
  servis: 'service',
  koruma: 'defender',
  guvenlikduvari: 'firewall',
  ortam: 'env',
  yol: 'path',
  global: 'global',
  'global-paketler': 'global',
  yardim: 'help',
  surum: 'version',
  sifre: 'password',
  sifreolustur: 'password'
}

const CLEAN_TARGETS: Record<string, string> = {
  gecici: 'temp',
  onbellek: 'cache',
  'geri-donusum': 'recycle',
  geridonusum: 'recycle',
  onyukleme: 'prefetch'
}

const PROCESS_ACTIONS: Record<string, string> = {
  ara: 'search',
  kapat: 'kill',
  listele: 'list'
}

const PORT_ACTIONS: Record<string, string> = {
  kapat: 'kill',
  kontrol: 'check'
}

const STARTUP_ACTIONS: Record<string, string> = {
  kapat: 'disable',
  ac: 'enable',
  listele: 'list'
}

const SERVICE_ACTIONS: Record<string, string> = {
  baslat: 'start',
  durdur: 'stop',
  yeniden: 'restart',
  'yeniden-baslat': 'restart'
}

const LOG_ACTIONS: Record<string, string> = {
  temizle: 'clear',
  listele: 'list'
}

const DEV_ACTIONS: Record<string, string> = {
  temizle: 'clean',
  bilgi: 'info',
  bilgiler: 'info',
  listele: 'list',
  kaldir: 'uninstall'
}

const GLOBAL_ACTIONS: Record<string, string> = {
  kaldir: 'uninstall',
  listele: 'list'
}

function mapWord(word: string | undefined, map: Record<string, string>): string | undefined {
  if (!word) return word
  const lower = word.toLowerCase()
  return map[lower] ?? word
}

export function normalizeArgv(argv: string[]): string[] {
  const result = [...argv]
  if (result.length < 3) return result

  const mainIdx = 2
  const main = result[mainIdx]?.toLowerCase()
  if (!main) return result

  const mappedMain = MAIN_COMMANDS[main] ?? main
  result[mainIdx] = mappedMain

  const action = result[mainIdx + 1]?.toLowerCase()

  switch (mappedMain) {
    case 'clean':
      if (action) result[mainIdx + 1] = mapWord(action, CLEAN_TARGETS) ?? action
      break

    case 'process':
      if (action) result[mainIdx + 1] = mapWord(action, PROCESS_ACTIONS) ?? action
      break

    case 'port':
      if (action) result[mainIdx + 1] = mapWord(action, PORT_ACTIONS) ?? action
      break

    case 'startup':
      if (action) result[mainIdx + 1] = mapWord(action, STARTUP_ACTIONS) ?? action
      break

    case 'service':
      if (action) result[mainIdx + 1] = mapWord(action, SERVICE_ACTIONS) ?? action
      break

    case 'logs':
      if (action) result[mainIdx + 1] = mapWord(action, LOG_ACTIONS) ?? action
      break

    case 'global':
      if (action) result[mainIdx + 1] = mapWord(action, GLOBAL_ACTIONS) ?? action
      break

    case 'npm':
    case 'pnpm':
    case 'bun':
      if (action) result[mainIdx + 1] = mapWord(action, DEV_ACTIONS) ?? action
      break

    case 'docker':
      if (action === 'temizle') result[mainIdx + 1] = 'prune'
      break
  }

  return result
}

export const TURKISH_COMMANDS_HELP = [
  { tr: 'temizle', en: 'clean', desc: 'Sistem temizliği' },
  { tr: 'analiz', en: 'analyze', desc: 'Temizlenebilir alan analizi' },
  { tr: 'rapor', en: 'report', desc: 'Sistem raporu' },
  { tr: 'bilgi', en: 'info', desc: 'Bilgisayar bilgileri' },
  { tr: 'bellek', en: 'ram', desc: 'RAM bilgisi' },
  { tr: 'islemci', en: 'cpu', desc: 'CPU bilgisi' },
  { tr: 'ekrankarti', en: 'gpu', desc: 'GPU bilgisi' },
  { tr: 'donanim', en: 'hardware', desc: 'Donanım özeti' },
  { tr: 'calisma-suresi', en: 'uptime', desc: 'Çalışma süresi' },
  { tr: 'islem', en: 'process', desc: 'İşlem yönetimi' },
  { tr: 'portlar', en: 'ports', desc: 'Açık portlar' },
  { tr: 'ag', en: 'network', desc: 'Ağ bilgileri' },
  { tr: 'guncelle', en: 'update', desc: 'Winget güncelleme' },
  { tr: 'ara', en: 'search', desc: 'Paket ara' },
  { tr: 'yukle', en: 'install', desc: 'Paket yükle' },
  { tr: 'kaldir', en: 'uninstall', desc: 'Paket kaldır' },
  { tr: 'baslangic', en: 'startup', desc: 'Başlangıç programları' },
  { tr: 'buyuk', en: 'largest', desc: 'Büyük dosyalar' },
  { tr: 'bul', en: 'find', desc: 'Dosya ara' },
  { tr: 'boyut', en: 'size', desc: 'Klasör boyutu' },
  { tr: 'agac', en: 'tree', desc: 'Klasör ağacı' },
  { tr: 'loglar', en: 'logs', desc: 'gkatar logları' },
  { tr: 'servisler', en: 'services', desc: 'Windows servisleri' },
  { tr: 'yardim', en: 'help', desc: 'Yardım menüsü' },
  { tr: 'surum', en: 'version', desc: 'Versiyon bilgisi' }
]
