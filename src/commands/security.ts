import { runPowerShell } from '../utils/exec.js'
import { title, label } from '../utils/output.js'

export async function defender(): Promise<void> {
  title('Windows Defender Durumu')
  const script = `
    Get-MpComputerStatus | Select-Object AMServiceEnabled, AntispywareEnabled, AntivirusEnabled,
      RealTimeProtectionEnabled, IoavProtectionEnabled, NISEnabled, QuickScanAge, FullScanAge |
    ConvertTo-Json
  `
  try {
    const data = JSON.parse(await runPowerShell(script))
    label('Servis', data.AMServiceEnabled ? 'Aktif' : 'Kapalı')
    label('Antivirus', data.AntivirusEnabled ? 'Aktif' : 'Kapalı')
    label('Gerçek Zamanlı', data.RealTimeProtectionEnabled ? 'Aktif' : 'Kapalı')
    label('Spyware Koruması', data.AntispywareEnabled ? 'Aktif' : 'Kapalı')
    label('Son Hızlı Tarama', `${data.QuickScanAge} gün önce`)
    label('Son Tam Tarama', `${data.FullScanAge} gün önce`)
  } catch {
    console.log('  Defender bilgisi alınamadı')
  }
}

export async function firewall(): Promise<void> {
  title('Firewall Durumu')
  const script = `
    Get-NetFirewallProfile | ForEach-Object {
      [PSCustomObject]@{
        Profile = $_.Name
        Enabled = $_.Enabled
        DefaultInbound = $_.DefaultInboundAction
        DefaultOutbound = $_.DefaultOutboundAction
      }
    } | ConvertTo-Json
  `
  const profiles = JSON.parse(await runPowerShell(script))
  const list = Array.isArray(profiles) ? profiles : [profiles]
  for (const p of list) {
    console.log(`\n  ${p.Profile}`)
    label('Durum', p.Enabled ? 'Aktif' : 'Kapalı')
    label('Gelen', String(p.DefaultInbound))
    label('Giden', String(p.DefaultOutbound))
  }
}

export async function env(): Promise<void> {
  title('Environment Değişkenleri')
  const sorted = Object.entries(process.env).sort(([a], [b]) => a!.localeCompare(b!))
  for (const [key, value] of sorted) {
    if (key && value) {
      console.log(`  ${key}=${value}`)
    }
  }
}

export async function path(): Promise<void> {
  title('PATH')
  const pathValue = process.env.PATH || ''
  const entries = pathValue.split(';').filter(Boolean)
  entries.forEach((entry, i) => {
    console.log(`  [${i + 1}] ${entry}`)
  })
}
