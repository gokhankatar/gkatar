import { runPowerShell, formatBytes, formatDuration } from '../utils/exec.js'
import { title, label } from '../utils/output.js'

export async function info(): Promise<void> {
  title('Bilgisayar Bilgileri')
  const script = `
    $cs = Get-CimInstance Win32_ComputerSystem
    $os = Get-CimInstance Win32_OperatingSystem
    [PSCustomObject]@{
      ComputerName = $env:COMPUTERNAME
      Manufacturer = $cs.Manufacturer
      Model = $cs.Model
      OS = $os.Caption
      Version = $os.Version
      Build = $os.BuildNumber
      Architecture = $os.OSArchitecture
      User = $env:USERNAME
      Domain = $cs.Domain
    } | ConvertTo-Json
  `
  const data = JSON.parse(await runPowerShell(script))
  label('Bilgisayar', data.ComputerName)
  label('Üretici', data.Manufacturer)
  label('Model', data.Model)
  label('İşletim Sistemi', data.OS)
  label('Versiyon', `${data.Version} (Build ${data.Build})`)
  label('Mimari', data.Architecture)
  label('Kullanıcı', data.User)
  label('Domain', data.Domain)
}

export async function disk(): Promise<void> {
  title('Disk Bilgileri')
  const script = `
    Get-CimInstance Win32_LogicalDisk | ForEach-Object {
      [PSCustomObject]@{
        Drive = $_.DeviceID
        Label = $_.VolumeName
        FileSystem = $_.FileSystem
        TotalGB = [math]::Round($_.Size / 1GB, 2)
        FreeGB = [math]::Round($_.FreeSpace / 1GB, 2)
        UsedPercent = if ($_.Size -gt 0) { [math]::Round((($_.Size - $_.FreeSpace) / $_.Size) * 100, 1) } else { 0 }
      }
    } | ConvertTo-Json
  `
  const disks = JSON.parse(await runPowerShell(script)) as Array<{
    Drive: string
    Label: string
    FileSystem: string
    TotalGB: number
    FreeGB: number
    UsedPercent: number
  }>

  const list = Array.isArray(disks) ? disks : [disks]
  for (const d of list) {
    console.log(`\n  ${d.Drive} ${d.Label || '(etiket yok)'}`)
    label('Dosya Sistemi', d.FileSystem || '-')
    label('Toplam', `${d.TotalGB} GB`)
    label('Boş', `${d.FreeGB} GB`)
    label('Kullanım', `%${d.UsedPercent}`)
  }
}

export async function ram(): Promise<void> {
  title('RAM Bilgisi')
  const script = `
    $os = Get-CimInstance Win32_OperatingSystem
    $cs = Get-CimInstance Win32_ComputerSystem
    $total = $cs.TotalPhysicalMemory
    $free = $os.FreePhysicalMemory * 1024
    $used = $total - $free
    [PSCustomObject]@{
      TotalGB = [math]::Round($total / 1GB, 2)
      UsedGB = [math]::Round($used / 1GB, 2)
      FreeGB = [math]::Round($free / 1GB, 2)
      UsedPercent = [math]::Round(($used / $total) * 100, 1)
      Slots = (Get-CimInstance Win32_PhysicalMemory).Count
    } | ConvertTo-Json
  `
  const data = JSON.parse(await runPowerShell(script))
  label('Toplam RAM', `${data.TotalGB} GB`)
  label('Kullanılan', `${data.UsedGB} GB (%${data.UsedPercent})`)
  label('Boş', `${data.FreeGB} GB`)
  label('Slot Sayısı', String(data.Slots))
}

export async function cpu(): Promise<void> {
  title('CPU Bilgisi')
  const script = `
    $cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
    [PSCustomObject]@{
      Name = $cpu.Name.Trim()
      Cores = $cpu.NumberOfCores
      Logical = $cpu.NumberOfLogicalProcessors
      MaxMHz = $cpu.MaxClockSpeed
      CurrentLoad = (Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average
    } | ConvertTo-Json
  `
  const data = JSON.parse(await runPowerShell(script))
  label('İşlemci', data.Name)
  label('Çekirdek', String(data.Cores))
  label('Mantıksal', String(data.Logical))
  label('Max Hız', `${data.MaxMHz} MHz`)
  label('Yük', `%${Math.round(data.CurrentLoad || 0)}`)
}

export async function gpu(): Promise<void> {
  title('GPU Bilgisi')
  const script = `
    Get-CimInstance Win32_VideoController | ForEach-Object {
      [PSCustomObject]@{
        Name = $_.Name
        Driver = $_.DriverVersion
        VRAM_MB = [math]::Round($_.AdapterRAM / 1MB, 0)
        Resolution = "$($_.CurrentHorizontalResolution)x$($_.CurrentVerticalResolution)"
      }
    } | ConvertTo-Json
  `
  const gpus = JSON.parse(await runPowerShell(script))
  const list = Array.isArray(gpus) ? gpus : [gpus]
  for (const g of list) {
    console.log(`\n  ${g.Name}`)
    label('Sürücü', g.Driver)
    if (g.VRAM_MB > 0) label('VRAM', `${g.VRAM_MB} MB`)
    label('Çözünürlük', g.Resolution)
  }
}

export async function hardware(): Promise<void> {
  title('Donanım Özeti')
  await info()
  await cpu()
  await ram()
  await gpu()
  await disk()
}

export async function uptime(): Promise<void> {
  title('Çalışma Süresi')
  const script = `
    $os = Get-CimInstance Win32_OperatingSystem
    $uptime = (Get-Date) - $os.LastBootUpTime
    [PSCustomObject]@{
      LastBoot = $os.LastBootUpTime.ToString('o')
      TotalSeconds = [int]$uptime.TotalSeconds
    } | ConvertTo-Json
  `
  const data = JSON.parse(await runPowerShell(script))
  label('Son Açılış', new Date(data.LastBoot).toLocaleString('tr-TR'))
  label('Çalışma Süresi', formatDuration(data.TotalSeconds))
}
