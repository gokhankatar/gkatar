import { runPowerShell } from '../utils/exec.js'
import { readLogs, clearLogs, getLogPath } from '../utils/logger.js'
import { title, success, dim } from '../utils/output.js'

export async function showLogs(): Promise<void> {
  title('gkatar Logları')
  dim(`Dosya: ${getLogPath()}`)
  const logs = readLogs()
  if (!logs.trim()) {
    console.log('\n  Henüz log kaydı yok.')
    return
  }
  console.log('\n' + logs)
}

export async function clearGkatarLogs(): Promise<void> {
  title('Logları Temizle')
  clearLogs()
  success('gkatar logları temizlendi')
}

export async function events(): Promise<void> {
  title('Windows Event Log (Son 20 Hata)')
  const script = `
    Get-WinEvent -FilterHashtable @{LogName='System'; Level=2} -MaxEvents 20 -ErrorAction SilentlyContinue |
    ForEach-Object {
      [PSCustomObject]@{
        Time = $_.TimeCreated.ToString('yyyy-MM-dd HH:mm')
        Source = $_.ProviderName
        Id = $_.Id
        Message = ($_.Message -split '\\n')[0].Substring(0, [Math]::Min(80, ($_.Message -split '\\n')[0].Length))
      }
    } | ConvertTo-Json
  `
  try {
    const events = JSON.parse(await runPowerShell(script))
    const list = Array.isArray(events) ? events : events ? [events] : []
    for (const e of list) {
      console.log(`\n  [${e.Time}] ${e.Source} (${e.Id})`)
      console.log(`    ${e.Message}`)
    }
  } catch {
    console.log('  Event log okunamadı (yönetici yetkisi gerekebilir)')
  }
}
