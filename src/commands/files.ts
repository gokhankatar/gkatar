import { runPowerShell, formatBytes } from '../utils/exec.js'
import { title, warn } from '../utils/output.js'

export async function largest(dir?: string): Promise<void> {
  title('En Büyük Dosyalar')
  const searchPath = dir || process.env.USERPROFILE || 'C:\\'
  const script = `
    Get-ChildItem -Path '${searchPath.replace(/'/g, "''")}' -Recurse -File -Force -ErrorAction SilentlyContinue |
    Sort-Object Length -Descending |
    Select-Object -First 20 |
    ForEach-Object {
      [PSCustomObject]@{
        Size = $_.Length
        Path = $_.FullName
      }
    } | ConvertTo-Json
  `
  const files = JSON.parse(await runPowerShell(script))
  const list = Array.isArray(files) ? files : files ? [files] : []

  for (const f of list) {
    console.log(`  ${formatBytes(f.Size).padEnd(12)} ${f.Path}`)
  }
}

export async function find(pattern: string, dir?: string): Promise<void> {
  title(`Dosya Ara: ${pattern}`)
  const searchPath = dir || process.cwd()
  const script = `
    Get-ChildItem -Path '${searchPath.replace(/'/g, "''")}' -Recurse -Filter '${pattern.replace(/'/g, "''")}' -Force -ErrorAction SilentlyContinue |
    Select-Object -First 50 |
    ForEach-Object { $_.FullName } |
    ConvertTo-Json
  `
  const files = JSON.parse(await runPowerShell(script))
  const list = Array.isArray(files) ? files : files ? [files] : []

  if (list.length === 0) {
    warn('Dosya bulunamadı')
    return
  }

  for (const f of list) {
    console.log(`  ${f}`)
  }
}

export async function size(targetPath: string): Promise<void> {
  title(`Klasör Boyutu: ${targetPath}`)
  const script = `
    $size = (Get-ChildItem -Path '${targetPath.replace(/'/g, "''")}' -Recurse -Force -ErrorAction SilentlyContinue |
      Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
    if ($null -eq $size) { 0 } else { $size }
  `
  const bytes = parseInt(await runPowerShell(script, { silent: true }), 10) || 0
  console.log(`  ${targetPath}: ${formatBytes(bytes)}`)
}

export async function tree(targetPath: string, depth = 3): Promise<void> {
  title(`Klasör Ağacı: ${targetPath}`)
  const script = `
    function Show-Tree($path, $prefix, $currentDepth, $maxDepth) {
      if ($currentDepth -gt $maxDepth) { return }
      $items = Get-ChildItem $path -Force -ErrorAction SilentlyContinue | Sort-Object { -not $_.PSIsContainer }, Name
      $count = $items.Count
      for ($i = 0; $i -lt $count; $i++) {
        $item = $items[$i]
        $isLast = ($i -eq $count - 1)
        $connector = if ($isLast) { '└── ' } else { '├── ' }
        $name = if ($item.PSIsContainer) { $item.Name + '/' } else { $item.Name }
        Write-Output ($prefix + $connector + $name)
        if ($item.PSIsContainer) {
          $newPrefix = $prefix + (if ($isLast) { '    ' } else { '│   ' })
          Show-Tree $item.FullName $newPrefix ($currentDepth + 1) $maxDepth
        }
      }
    }
    Write-Output (Split-Path '${targetPath.replace(/'/g, "''")}' -Leaf)
    Show-Tree '${targetPath.replace(/'/g, "''")}' '' 1 ${depth}
  `
  const output = await runPowerShell(script)
  console.log(output.split('\n').map((l) => `  ${l}`).join('\n'))
}
