import { runPowerShell } from '../utils/exec.js'
import { title, success, warn, printTable } from '../utils/output.js'
import { log } from '../utils/logger.js'

export async function listPorts(): Promise<void> {
  title('Açık Portlar', '🌐')
  const script = `
    Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
    Select-Object LocalAddress, LocalPort, OwningProcess |
    Sort-Object LocalPort |
  ForEach-Object {
      $proc = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
      [PSCustomObject]@{
        Port = $_.LocalPort
        Address = $_.LocalAddress
        PID = $_.OwningProcess
        Process = if ($proc) { $proc.ProcessName } else { 'unknown' }
      }
    } | ConvertTo-Json
  `
  const ports = JSON.parse(await runPowerShell(script))
  const list = Array.isArray(ports) ? ports : ports ? [ports] : []

  printTable(
    ['Port', 'PID', 'İşlem', 'Adres'],
    list.map((p: { Port: number; PID: number; Process: string; Address: string }) => [
      String(p.Port),
      String(p.PID),
      p.Process || '-',
      p.Address
    ])
  )
}

export async function checkPort(port: number): Promise<void> {
  title(`Port Kontrol: ${port}`, '🔎')
  const script = `
    $conn = Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($conn) {
      $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
      [PSCustomObject]@{
        InUse = $true
        State = $conn.State
        PID = $conn.OwningProcess
        Process = if ($proc) { $proc.ProcessName } else { 'unknown' }
        Address = $conn.LocalAddress
      } | ConvertTo-Json
    } else {
      '{"InUse":false}' 
    }
  `
  const data = JSON.parse(await runPowerShell(script))
  if (data.InUse) {
    console.log(`  Port ${port} kullanımda`)
    console.log(`  İşlem: ${data.Process} (PID: ${data.PID})`)
    console.log(`  Durum: ${data.State}`)
    console.log(`  Adres: ${data.Address}`)
  } else {
    console.log(`  Port ${port} boş`)
  }
}

export async function killPort(port: number): Promise<void> {
  title(`Port Kapat: ${port}`, '🛑')
  const script = `
    $conns = Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue
  $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
    $count = 0
    foreach ($pid in $pids) {
      try {
        Stop-Process -Id $pid -Force -ErrorAction Stop
        $count++
      } catch {}
    }
    $count
  `
  const count = parseInt(await runPowerShell(script), 10) || 0
  if (count > 0) {
    success(`Port ${port} üzerindeki ${count} işlem kapatıldı`)
    log(`port kill: ${port} - ${count}`)
  } else {
    warn(`Port ${port} üzerinde kapatılacak işlem bulunamadı`)
  }
}
