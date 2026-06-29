import { runPowerShell, runCmd } from '../utils/exec.js'
import { title, label } from '../utils/output.js'

export async function network(): Promise<void> {
  title('Ağ Bilgileri')
  const script = `
    Get-NetAdapter | Where-Object Status -eq 'Up' | ForEach-Object {
      $ip = Get-NetIPAddress -InterfaceIndex $_.ifIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue |
        Where-Object { $_.IPAddress -notlike '169.*' } | Select-Object -First 1
      [PSCustomObject]@{
        Name = $_.Name
        Description = $_.InterfaceDescription
        MAC = $_.MacAddress
        Speed = $_.LinkSpeed
        IP = if ($ip) { $ip.IPAddress } else { '-' }
      }
    } | ConvertTo-Json
  `
  const adapters = JSON.parse(await runPowerShell(script))
  const list = Array.isArray(adapters) ? adapters : [adapters]
  for (const a of list) {
    console.log(`\n  ${a.Name}`)
    label('Açıklama', a.Description)
    label('MAC', a.MAC)
    label('Hız', a.Speed)
    label('IPv4', a.IP)
  }
}

export async function ip(): Promise<void> {
  title('IP Adresi')
  const script = `
    Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.IPAddress -notlike '127.*' -and $_.PrefixOrigin -ne 'WellKnown' } |
    ForEach-Object {
      [PSCustomObject]@{
        IP = $_.IPAddress
        Interface = (Get-NetAdapter -InterfaceIndex $_.InterfaceIndex -ErrorAction SilentlyContinue).Name
      }
    } | ConvertTo-Json
  `
  const ips = JSON.parse(await runPowerShell(script))
  const list = Array.isArray(ips) ? ips : ips ? [ips] : []
  for (const item of list) {
    console.log(`  ${item.IP} (${item.Interface})`)
  }
}

export async function dns(): Promise<void> {
  title('DNS Bilgisi')
  const script = `
    Get-DnsClientServerAddress -AddressFamily IPv4 |
    Where-Object { $_.ServerAddresses.Count -gt 0 } |
    ForEach-Object {
      [PSCustomObject]@{
        Interface = (Get-NetAdapter -InterfaceIndex $_.InterfaceIndex -ErrorAction SilentlyContinue).Name
        DNS = ($_.ServerAddresses -join ', ')
      }
    } | ConvertTo-Json
  `
  const servers = JSON.parse(await runPowerShell(script))
  const list = Array.isArray(servers) ? servers : [servers]
  for (const s of list) {
    console.log(`  ${s.Interface}: ${s.DNS}`)
  }
}

export async function ping(host: string): Promise<void> {
  title(`Ping: ${host}`)
  const output = await runCmd('ping', ['-n', '4', host])
  console.log(output)
}
