import { runPowerShell } from '../utils/exec.js'
import { title, success, warn } from '../utils/output.js'
import { log } from '../utils/logger.js'

export async function listServices(): Promise<void> {
  title('Windows Servisleri')
  const script = `
    Get-Service | Sort-Object Status, DisplayName |
    Select-Object -First 40 |
    ForEach-Object {
      [PSCustomObject]@{
        Name = $_.Name
        DisplayName = $_.DisplayName
        Status = $_.Status.ToString()
        StartType = $_.StartType.ToString()
      }
    } | ConvertTo-Json
  `
  const services = JSON.parse(await runPowerShell(script))
  const list = Array.isArray(services) ? services : [services]

  console.log(`  ${'Servis'.padEnd(25)} ${'Durum'.padEnd(12)} Başlangıç`)
  console.log(`  ${'─'.repeat(55)}`)
  for (const s of list) {
    console.log(`  ${s.Name.padEnd(25)} ${s.Status.padEnd(12)} ${s.StartType}`)
  }
}

export async function serviceAction(action: 'start' | 'stop' | 'restart', name: string): Promise<void> {
  title(`Servis ${action}: ${name}`)
  const script = `
    $svc = Get-Service -Name '*${name.replace(/'/g, "''")}*' -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $svc) { 'notfound'; return }
    switch ('${action}') {
      'start' { Start-Service $svc.Name -ErrorAction Stop; 'started' }
      'stop' { Stop-Service $svc.Name -Force -ErrorAction Stop; 'stopped' }
      'restart' { Restart-Service $svc.Name -Force -ErrorAction Stop; 'restarted' }
    }
  `
  try {
    const result = await runPowerShell(script)
    if (result === 'notfound') {
      warn(`Servis bulunamadı: ${name}`)
    } else {
      success(`Servis ${result}: ${name}`)
      log(`service ${action}: ${name}`)
    }
  } catch (err) {
    warn(`Servis işlemi başarısız (yönetici yetkisi gerekebilir): ${err}`)
  }
}
