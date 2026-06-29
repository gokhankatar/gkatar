import { runPowerShell, formatBytes } from '../utils/exec.js'
import { log } from '../utils/logger.js'
import { createSpinner } from '../utils/spinner.js'
import { success, warn, title, printTable } from '../utils/output.js'

type CleanTarget = 'all' | 'temp' | 'cache' | 'prefetch' | 'recycle' | 'dns'

async function getFolderSize(path: string): Promise<number> {
  const script = `
    $size = (Get-ChildItem -Path '${path.replace(/'/g, "''")}' -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
    if ($null -eq $size) { 0 } else { $size }
  `
  const result = await runPowerShell(script, { silent: true })
  return parseInt(result, 10) || 0
}

async function cleanTemp(): Promise<number> {
  const script = `
    $paths = @($env:TEMP, $env:WINDIR + '\\Temp')
    $total = 0
    foreach ($p in $paths) {
      if (Test-Path $p) {
        Get-ChildItem $p -Force -ErrorAction SilentlyContinue | ForEach-Object {
          try {
            $size = if ($_.PSIsContainer) {
              (Get-ChildItem $_.FullName -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
            } else { $_.Length }
            Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
            $total += [int64]$size
          } catch {}
        }
      }
    }
    $total
  `
  return parseInt(await runPowerShell(script, { silent: true }), 10) || 0
}

async function cleanCache(): Promise<number> {
  const script = `
    $paths = @(
      "$env:LOCALAPPDATA\\Microsoft\\Windows\\INetCache",
      "$env:LOCALAPPDATA\\Microsoft\\Windows\\Explorer"
    )
    $total = 0
    foreach ($p in $paths) {
      if (Test-Path $p) {
        Get-ChildItem $p -Force -ErrorAction SilentlyContinue | ForEach-Object {
          try {
            $size = if ($_.PSIsContainer) {
              (Get-ChildItem $_.FullName -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
            } else { $_.Length }
            Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
            $total += [int64]$size
          } catch {}
        }
      }
    }
    $total
  `
  return parseInt(await runPowerShell(script, { silent: true }), 10) || 0
}

async function cleanPrefetch(): Promise<number> {
  const script = `
    $path = "$env:WINDIR\\Prefetch"
    $total = 0
    if (Test-Path $path) {
      Get-ChildItem $path -Force -ErrorAction SilentlyContinue | ForEach-Object {
        try {
          $total += $_.Length
          Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue
        } catch {}
      }
    }
    $total
  `
  return parseInt(await runPowerShell(script, { silent: true }), 10) || 0
}

async function cleanRecycle(): Promise<void> {
  await runPowerShell('Clear-RecycleBin -Force -ErrorAction SilentlyContinue', { silent: true })
}

async function cleanDns(): Promise<void> {
  await runPowerShell('ipconfig /flushdns | Out-Null; Clear-DnsClientCache -ErrorAction SilentlyContinue', { silent: true })
}

export async function clean(target: CleanTarget = 'all'): Promise<void> {
  title('Sistem Temizliği', '🧹')
  let totalFreed = 0

  const tasks: { name: string; fn: () => Promise<number | void> }[] = []

  if (target === 'all' || target === 'temp') {
    tasks.push({ name: 'Temp dosyaları', fn: cleanTemp })
  }
  if (target === 'all' || target === 'cache') {
    tasks.push({ name: 'Önbellek (Cache)', fn: cleanCache })
  }
  if (target === 'all' || target === 'prefetch') {
    tasks.push({ name: 'Prefetch', fn: cleanPrefetch })
  }
  if (target === 'all' || target === 'recycle') {
    tasks.push({ name: 'Geri dönüşüm kutusu', fn: cleanRecycle })
  }
  if (target === 'all' || target === 'dns') {
    tasks.push({ name: 'DNS önbelleği', fn: cleanDns })
  }

  for (const task of tasks) {
    const spinner = createSpinner(`${task.name} temizleniyor...`).start()
    try {
      const freed = await task.fn()
      if (typeof freed === 'number') totalFreed += freed
      spinner.succeed(`${task.name} temizlendi`)
      log(`clean: ${task.name} - ${typeof freed === 'number' ? formatBytes(freed) : 'ok'}`)
    } catch (err) {
      spinner.fail(`${task.name} temizlenemedi`)
      warn(String(err))
    }
  }

  if (totalFreed > 0) {
    success(`Toplam ${formatBytes(totalFreed)} alan boşaltıldı`)
  } else {
    success('Temizlik tamamlandı')
  }
}

export async function analyze(): Promise<void> {
  title('Temizlenebilir Alan Analizi', '📊')

  const paths = [
    { name: 'Temp', path: process.env.TEMP || '' },
    { name: 'Windows Temp', path: `${process.env.WINDIR}\\Temp` },
    { name: 'Prefetch', path: `${process.env.WINDIR}\\Prefetch` },
    { name: 'INetCache', path: `${process.env.LOCALAPPDATA}\\Microsoft\\Windows\\INetCache` },
    { name: 'Geri Dönüşüm', path: '$Recycle.Bin' }
  ]

  const rows: string[][] = []
  let total = 0

  for (const item of paths) {
    if (!item.path) continue
    const spinner = createSpinner(`${item.name} analiz ediliyor...`).start()
    try {
      const size = await getFolderSize(item.path)
      total += size
      spinner.stop()
      rows.push([item.name, formatBytes(size)])
    } catch {
      spinner.fail(`${item.name} analiz edilemedi`)
    }
  }

  rows.push(['TOPLAM', formatBytes(total)])
  printTable(['Konum', 'Boyut'], rows)
  log(`analyze: total ${formatBytes(total)}`)
}

export async function report(): Promise<void> {
  title('Sistem Raporu', '📋')
  const script = `
    $os = Get-CimInstance Win32_OperatingSystem
    $disk = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'"
    [PSCustomObject]@{
      FreeGB = [math]::Round($disk.FreeSpace / 1GB, 2)
      TotalGB = [math]::Round($disk.Size / 1GB, 2)
      UsedPercent = [math]::Round((($disk.Size - $disk.FreeSpace) / $disk.Size) * 100, 1)
      LastBoot = $os.LastBootUpTime
      UptimeHours = [math]::Round(((Get-Date) - $os.LastBootUpTime).TotalHours, 1)
    } | ConvertTo-Json
  `
  const result = await runPowerShell(script)
  const data = JSON.parse(result) as {
    FreeGB: number
    TotalGB: number
    UsedPercent: number
    LastBoot: string
    UptimeHours: number
  }

  console.log(`  Boş Alan (C:)      ${data.FreeGB} GB / ${data.TotalGB} GB`)
  console.log(`  Kullanım           %${data.UsedPercent}`)
  console.log(`  Son Açılış         ${new Date(data.LastBoot).toLocaleString('tr-TR')}`)
  console.log(`  Çalışma Süresi     ${data.UptimeHours} saat`)
  log(`report: C: ${data.FreeGB}GB free`)
}
