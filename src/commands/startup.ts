import { runPowerShell } from '../utils/exec.js'
import { title, success, warn } from '../utils/output.js'
import { log } from '../utils/logger.js'

export async function listStartup(): Promise<void> {
  title('Başlangıç Uygulamaları')
  const script = `
    $items = @()
    $regPaths = @(
      'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
      'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'
    )
    foreach ($path in $regPaths) {
      if (Test-Path $path) {
        Get-ItemProperty $path -ErrorAction SilentlyContinue | Get-Member -MemberType NoteProperty |
        Where-Object { $_.Name -notin @('PSPath','PSParentPath','PSChildName','PSDrive','PSProvider') } |
        ForEach-Object {
          $name = $_.Name
          $value = (Get-ItemProperty $path).$name
          $items += [PSCustomObject]@{ Name = $name; Command = $value; Location = $path }
        }
      }
    }
    $startupFolder = [Environment]::GetFolderPath('Startup')
    if (Test-Path $startupFolder) {
      Get-ChildItem $startupFolder -ErrorAction SilentlyContinue | ForEach-Object {
        $items += [PSCustomObject]@{ Name = $_.BaseName; Command = $_.FullName; Location = 'Startup Folder' }
      }
    }
    $items | ConvertTo-Json
  `
  const items = JSON.parse(await runPowerShell(script))
  const list = Array.isArray(items) ? items : items ? [items] : []

  if (list.length === 0) {
    warn('Başlangıç uygulaması bulunamadı')
    return
  }

  for (const item of list) {
    console.log(`\n  ${item.Name}`)
    console.log(`    ${item.Command}`)
    console.log(`    Konum: ${item.Location}`)
  }
}

export async function disableStartup(name: string): Promise<void> {
  title(`Başlangıçtan Kapat: ${name}`)
  const script = `
    $paths = @(
      'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
      'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'
    )
    $found = $false
    foreach ($path in $paths) {
      $props = Get-ItemProperty $path -ErrorAction SilentlyContinue
      $match = $props.PSObject.Properties | Where-Object { $_.Name -like '*${name.replace(/'/g, "''")}*' }
      foreach ($m in $match) {
        Remove-ItemProperty -Path $path -Name $m.Name -ErrorAction SilentlyContinue
        $found = $true
      }
    }
    if ($found) { 'ok' } else { 'notfound' }
  `
  const result = await runPowerShell(script)
  if (result === 'ok') {
    success(`${name} başlangıçtan kaldırıldı`)
    log(`startup disable: ${name}`)
  } else {
    warn(`${name} bulunamadı`)
  }
}

export async function enableStartup(name: string, command?: string): Promise<void> {
  title(`Başlangıca Ekle: ${name}`)
  if (!command) {
    warn('Komut belirtilmedi. Kullanım: gkatar startup enable <isim> --command "<yol>"')
    return
  }
  const script = `
    Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run' -Name '${name.replace(/'/g, "''")}' -Value '${command.replace(/'/g, "''")}'
    'ok'
  `
  await runPowerShell(script)
  success(`${name} başlangıca eklendi`)
  log(`startup enable: ${name}`)
}
