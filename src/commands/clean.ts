import { runPowerShell, formatBytes } from '../utils/exec.js'
import { log } from '../utils/logger.js'
import { createSpinner } from '../utils/spinner.js'
import { success, warn, title, printTable, info } from '../utils/output.js'

type CleanTarget = 'all' | 'temp' | 'cache' | 'prefetch' | 'recycle' | 'dns'

const PS_REMOVE_AND_COUNT = `
function Get-ItemSize {
  param([System.IO.FileSystemInfo]$Item)
  if ($Item.Attributes -band [IO.FileAttributes]::ReparsePoint) { return 0 }
  if ($Item.PSIsContainer) {
    $sum = (Get-ChildItem -LiteralPath $Item.FullName -Recurse -Force -File -ErrorAction SilentlyContinue |
      Where-Object { -not ($_.Attributes -band [IO.FileAttributes]::ReparsePoint) } |
      Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
    if ($null -eq $sum) { return 0 }
    return [int64]$sum
  }
  return [int64]$Item.Length
}

function Remove-AndCount {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) { return 0 }
  $item = Get-Item -LiteralPath $Path -Force -ErrorAction SilentlyContinue
  if (-not $item) { return 0 }
  $size = Get-ItemSize $item
  Remove-Item -LiteralPath $Path -Recurse -Force -ErrorAction SilentlyContinue
  if (-not (Test-Path -LiteralPath $Path)) { return $size }
  return 0
}

function Clear-DirChildren {
  param([string]$Dir)
  $total = [int64]0
  if (-not (Test-Path -LiteralPath $Dir)) { return 0 }
  Get-ChildItem -LiteralPath $Dir -Force -ErrorAction SilentlyContinue | ForEach-Object {
  if ($_.Attributes -band [IO.FileAttributes]::ReparsePoint) { return }
    $total += Remove-AndCount $_.FullName
  }
  return $total
}
`

async function getDiskFreeBytes(drive = 'C:'): Promise<number> {
  const letter = drive.replace(':', '')
  const script = `(Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='${letter}:'").FreeSpace`
  return parseInt(await runPowerShell(script, { silent: true }), 10) || 0
}

async function getFolderSize(path: string): Promise<number> {
  const script = `
    ${PS_REMOVE_AND_COUNT}
    $item = Get-Item -LiteralPath '${path.replace(/'/g, "''")}' -Force -ErrorAction SilentlyContinue
    if (-not $item) { 0 } else { Get-ItemSize $item }
  `
  return parseInt(await runPowerShell(script, { silent: true }), 10) || 0
}

async function cleanTemp(): Promise<number> {
  const script = `
    ${PS_REMOVE_AND_COUNT}
    $total = [int64]0
    $total += Clear-DirChildren $env:TEMP
    $total += Clear-DirChildren ($env:WINDIR + '\\Temp')
    $total
  `
  return parseInt(await runPowerShell(script, { silent: true }), 10) || 0
}

async function cleanCache(): Promise<number> {
  const script = `
    ${PS_REMOVE_AND_COUNT}
    $total = [int64]0
    $total += Clear-DirChildren "$env:LOCALAPPDATA\\Microsoft\\Windows\\INetCache"
    $total += Clear-DirChildren "$env:LOCALAPPDATA\\Microsoft\\Windows\\Explorer"
    $total
  `
  return parseInt(await runPowerShell(script, { silent: true }), 10) || 0
}

async function cleanPrefetch(): Promise<number> {
  const script = `
    ${PS_REMOVE_AND_COUNT}
    Clear-DirChildren "$env:WINDIR\\Prefetch"
  `
  return parseInt(await runPowerShell(script, { silent: true }), 10) || 0
}

async function cleanRecycle(): Promise<number> {
  const script = `
    $freed = [int64]0
    try {
      $shell = New-Object -ComObject Shell.Application
      $bin = $shell.Namespace(0x0a)
      if ($bin) {
        foreach ($item in @($bin.Items())) {
          try {
            $freed += [int64]$item.Size
            $item.InvokeVerb('delete')
          } catch {}
        }
      }
    } catch {}
    if ($freed -eq 0) {
      try { Clear-RecycleBin -Force -ErrorAction SilentlyContinue } catch {}
    }
    $freed
  `
  return parseInt(await runPowerShell(script, { silent: true }), 10) || 0
}

async function cleanDns(): Promise<void> {
  await runPowerShell(
    'ipconfig /flushdns | Out-Null; Clear-DnsClientCache -ErrorAction SilentlyContinue',
    { silent: true }
  )
}

export async function clean(target: CleanTarget = 'all'): Promise<void> {
  title('Sistem Temizliği', '🧹')

  const freeBefore = await getDiskFreeBytes()
  let reportedFreed = 0

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
      if (typeof freed === 'number') {
        reportedFreed += freed
        const label = freed > 0 ? `${task.name} temizlendi (${formatBytes(freed)})` : `${task.name} — silinecek dosya yok`
        spinner.succeed(label)
        log(`clean: ${task.name} - ${formatBytes(freed)}`)
      } else {
        spinner.succeed(`${task.name} temizlendi`)
        log(`clean: ${task.name} - ok`)
      }
    } catch (err) {
      spinner.fail(`${task.name} temizlenemedi`)
      warn(String(err))
    }
  }

  const freeAfter = await getDiskFreeBytes()
  const actualFreed = Math.max(0, freeAfter - freeBefore)

  console.log()
  if (actualFreed > 0) {
    success(`Gerçekten boşaltılan alan: ${formatBytes(actualFreed)} (C: diski)`)
  } else {
    success('Temizlik tamamlandı — diskte ölçülebilir alan kazanılmadı')
  }

  if (reportedFreed > actualFreed + 50 * 1024 * 1024) {
    info(
      'Not: Kilitli veya kullanımdaki dosyalar sayılır ama silinemez. ' +
        'Bu yüzden eski sürümde yanıltıcı yüksek rakamlar görünebilirdi.'
    )
  }

  log(`clean: reported=${formatBytes(reportedFreed)} actual=${formatBytes(actualFreed)}`)
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
  info('Analiz, klasördeki toplam boyutu gösterir. Kilitli dosyalar temizlikte silinmeyebilir.')
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
