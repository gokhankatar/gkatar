import { runPowerShell } from '../utils/exec.js'
import { title, success, warn, printTable } from '../utils/output.js'
import { log } from '../utils/logger.js'

export async function listProcesses(): Promise<void> {
  title('Çalışan İşlemler', '⚙️')
  const script = `
    Get-Process | Sort-Object CPU -Descending | Select-Object -First 30 |
    ForEach-Object {
      [PSCustomObject]@{
        Name = $_.ProcessName
        PID = $_.Id
        CPU = [math]::Round($_.CPU, 1)
        MemoryMB = [math]::Round($_.WorkingSet64 / 1MB, 1)
      }
    } | ConvertTo-Json
  `
  const processes = JSON.parse(await runPowerShell(script))
  const list = Array.isArray(processes) ? processes : [processes]

  printTable(
    ['PID', 'İşlem', 'CPU', 'Bellek'],
    list.map((p: { PID: number; Name: string; CPU: number; MemoryMB: number }) => [
      String(p.PID),
      p.Name,
      String(p.CPU),
      `${p.MemoryMB} MB`
    ])
  )
}

export async function searchProcess(query: string): Promise<void> {
  title(`İşlem Arama: ${query}`, '🔍')
  const script = `
    Get-Process | Where-Object { $_.ProcessName -like '*${query.replace(/'/g, "''")}*' } |
    ForEach-Object {
      [PSCustomObject]@{
        Name = $_.ProcessName
        PID = $_.Id
        MemoryMB = [math]::Round($_.WorkingSet64 / 1MB, 1)
      }
    } | ConvertTo-Json
  `
  const processes = JSON.parse(await runPowerShell(script))
  const list = Array.isArray(processes) ? processes : processes ? [processes] : []

  if (list.length === 0) {
    warn('Eşleşen işlem bulunamadı')
    return
  }

  printTable(
    ['PID', 'İşlem', 'Bellek'],
    list.map((p: { PID: number; Name: string; MemoryMB: number }) => [
      String(p.PID),
      p.Name,
      `${p.MemoryMB} MB`
    ])
  )
}

export async function killProcess(query: string): Promise<void> {
  title(`İşlem Kapat: ${query}`, '🛑')
  const script = `
    $procs = Get-Process | Where-Object { $_.ProcessName -like '*${query.replace(/'/g, "''")}*' }
    $count = ($procs | Measure-Object).Count
    $procs | Stop-Process -Force -ErrorAction SilentlyContinue
    $count
  `
  const count = parseInt(await runPowerShell(script), 10) || 0
  if (count > 0) {
    success(`${count} işlem kapatıldı`)
    log(`process kill: ${query} - ${count}`)
  } else {
    warn('Kapatılacak işlem bulunamadı')
  }
}
