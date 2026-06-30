import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import chalk from 'chalk'
import gradient from 'gradient-string'
import autocannon from 'autocannon'
import { runPowerShell } from '../utils/exec.js'
import { getConfigDir, log } from '../utils/logger.js'
import { box, divider, error, info, label, printTable, section, success, warn } from '../utils/output.js'
import { createSpinner } from '../utils/spinner.js'

const brand = gradient(['#00d4ff', '#7b2ff7', '#f107a3'])
const metric = gradient(['#00d4ff', '#7b2ff7'])
const warm = gradient(['#f7971e', '#ffd200'])
const cool = gradient(['#11998e', '#38ef7d'])

export interface TestOptions {
  url: string
  duration?: number
  connections?: number
  amount?: number
  method?: string
  pipelining?: number
  timeout?: number
  maxConnections?: number
  step?: number
  json?: boolean
  save?: boolean
}

interface SystemSample {
  time: string
  cpuPercent: number
  ramPercent: number
  ramUsedGB: number
}

const TEST_META: Record<string, { icon: string; label: string; color: typeof brand }> = {
  load: { icon: '🔥', label: 'Yük Testi', color: warm },
  benchmark: { icon: '📊', label: 'Benchmark', color: cool },
  stress: { icon: '💥', label: 'Stres Testi', color: brand },
  monitor: { icon: '📡', label: 'İzleme Testi', color: metric }
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim()
  if (!/^https?:\/\//i.test(trimmed)) return `http://${trimmed}`
  return trimmed
}

function runTest(opts: autocannon.Options): Promise<autocannon.Result> {
  return new Promise((resolve, reject) => {
    autocannon(opts, (err, result) => {
      if (err) reject(err)
      else resolve(result)
    })
  })
}

async function sampleSystemMetrics(): Promise<Omit<SystemSample, 'time'>> {
  const script = `
    $os = Get-CimInstance Win32_OperatingSystem
    $cs = Get-CimInstance Win32_ComputerSystem
    $total = $cs.TotalPhysicalMemory
    $free = $os.FreePhysicalMemory * 1024
    $used = $total - $free
    $cpu = (Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average
    [PSCustomObject]@{
      CpuPercent = [math]::Round($cpu, 1)
      RamPercent = [math]::Round(($used / $total) * 100, 1)
      RamUsedGB = [math]::Round($used / 1GB, 2)
    } | ConvertTo-Json -Compress
  `
  const data = JSON.parse(await runPowerShell(script, { silent: true }))
  return {
    cpuPercent: data.CpuPercent ?? 0,
    ramPercent: data.RamPercent ?? 0,
    ramUsedGB: data.RamUsedGB ?? 0
  }
}

function buildAutocannonOptions(options: TestOptions): autocannon.Options {
  const opts: autocannon.Options = {
    url: normalizeUrl(options.url),
    connections: options.connections ?? 10,
    duration: options.duration ?? 10,
    method: (options.method ?? 'GET') as autocannon.Request['method'],
    pipelining: options.pipelining ?? 1,
    timeout: options.timeout ?? 10
  }
  if (options.amount) opts.amount = options.amount
  return opts
}

function formatMs(ms: number): string {
  return `${ms.toFixed(2)} ms`
}

function formatThroughput(bytes: number): string {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(2)} MB/s`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB/s`
  return `${bytes.toFixed(0)} B/s`
}

function progressBar(percent: number, width = 16): string {
  const clamped = Math.min(100, Math.max(0, percent))
  const filled = Math.round((clamped / 100) * width)
  const bar =
    (clamped > 80 ? chalk.red : clamped > 50 ? chalk.yellow : chalk.green)('█'.repeat(filled)) +
    chalk.hex('#333')('░'.repeat(width - filled))
  return `${bar} ${chalk.white.bold(`${clamped.toFixed(1)}%`)}`
}

function latencyColor(ms: number): string {
  if (ms < 100) return chalk.green(formatMs(ms))
  if (ms < 300) return chalk.yellow(formatMs(ms))
  return chalk.red(formatMs(ms))
}

function statusColor(count: number, type: 'ok' | 'warn' | 'err'): string {
  const str = String(count)
  if (count === 0 && type !== 'ok') return chalk.gray(str)
  if (type === 'ok') return chalk.green.bold(str)
  if (type === 'warn') return chalk.yellow.bold(str)
  return chalk.red.bold(str)
}

function errorRate(result: autocannon.Result): number {
  if (result.requests.total === 0) return 0
  return ((result.errors + result.timeouts + result.non2xx) / result.requests.total) * 100
}

function printTestBanner(
  testKey: keyof typeof TEST_META,
  config: { url: string; sure: string; baglanti: string; extra?: string }
): void {
  const meta = TEST_META[testKey]
  const header = meta.color(`${meta.icon}  ${meta.label}`)
  const lines = [
    `${chalk.gray('Hedef')}     ${chalk.cyan.bold(config.url)}`,
    `${chalk.gray('Süre')}      ${chalk.white.bold(config.sure)}`,
    `${chalk.gray('Bağlantı')}  ${chalk.white.bold(config.baglanti)}`,
    config.extra ? `${chalk.gray('Ek')}        ${chalk.hex('#a8b2d1')(config.extra)}` : ''
  ]
    .filter(Boolean)
    .join('\n')

  box(`${header}\n\n${lines}`, '⚡ Performans Testi')
}

function printHeroStats(result: autocannon.Result): void {
  const rps = result.requests.average.toFixed(1)
  const latency = result.latency.average.toFixed(1)
  const total = result.requests.total.toLocaleString('tr-TR')
  const throughput = formatThroughput(result.throughput.average)

  box(
    [
      `${metric('  İstek/sn')}          ${warm('  Gecikme')}`,
      `${chalk.white.bold(`  ${rps}`.padEnd(22))}${latencyColor(result.latency.average)}`,
      '',
      `${chalk.gray('Toplam istek')}  ${chalk.white.bold(total)}`,
      `${chalk.gray('Throughput')}    ${chalk.cyan(throughput)}`
    ].join('\n'),
    '🏆 Özet'
  )
}

function printResult(result: autocannon.Result, testKey: keyof typeof TEST_META): void {
  const meta = TEST_META[testKey]
  section(`${meta.icon} ${meta.label} Sonuçları`)

  printHeroStats(result)

  divider()

  printTable(
    [chalk.magenta('Metrik'), chalk.magenta('Değer')],
    [
      ['Toplam istek', chalk.white.bold(result.requests.total.toLocaleString('tr-TR'))],
      ['İstek/sn (ort.)', metric(result.requests.average.toFixed(2))],
      ['Throughput (ort.)', chalk.cyan(formatThroughput(result.throughput.average))],
      ['Gecikme (ort.)', latencyColor(result.latency.average)],
      ['Gecikme (min)', chalk.green(formatMs(result.latency.min))],
      ['Gecikme (max)', chalk.red(formatMs(result.latency.max))],
      ['2xx yanıt', statusColor(result['2xx'], 'ok')],
      ['4xx yanıt', statusColor(result['4xx'], 'warn')],
      ['5xx yanıt', statusColor(result['5xx'], 'err')],
      ['Hata', statusColor(result.errors, 'err')],
      ['Timeout', statusColor(result.timeouts, 'err')]
    ]
  )

  console.log()
  printTable(
    [chalk.magenta('Percentil'), chalk.magenta('Gecikme'), chalk.magenta('Durum')],
    [
      ['p50', latencyColor(result.latency.p50), chalk.gray('medyan')],
      ['p90', latencyColor(result.latency.p90), chalk.gray('iyi')],
      ['p95', latencyColor(result.latency.p97_5), chalk.gray('kabul')],
      ['p99', latencyColor(result.latency.p99), chalk.gray('kuyruk')]
    ]
  )

  const rate = errorRate(result)
  const rateStr = rate < 1 ? chalk.green.bold(`%${rate.toFixed(2)}`) : rate < 10 ? chalk.yellow.bold(`%${rate.toFixed(2)}`) : chalk.red.bold(`%${rate.toFixed(2)}`)

  console.log()
  label('Hata oranı', rateStr)

  if (result.errors > 0 || result.timeouts > 0) {
    box(
      `${chalk.red.bold('Test sorunlu tamamlandı')}\n` +
        `${chalk.gray('Hata:')} ${chalk.red(String(result.errors))}  ` +
        `${chalk.gray('Timeout:')} ${chalk.red(String(result.timeouts))}`,
      '⚠️ Uyarı'
    )
  } else if (result.non2xx > 0) {
    warn(`${result.non2xx} adet 2xx dışı yanıt alındı.`)
  } else {
    box(
      `${chalk.green.bold('Mükemmel!')} ${chalk.white('Tüm istekler başarıyla tamamlandı.')}\n` +
        `${chalk.gray('Süre:')} ${result.duration.toFixed(2)} sn  ` +
        `${chalk.gray('Bağlantı:')} ${result.connections}`,
      '✅ Sonuç'
    )
  }
}

function printBenchmarkDetail(result: autocannon.Result): void {
  section('📈 Detaylı İstatistik')
  const raw = autocannon.printResult(result)
  const colored = raw
    .split('\n')
    .map((line) => {
      if (line.includes('Latency') || line.includes('Req/Sec')) return chalk.cyan(line)
      if (line.includes('requests in')) return chalk.green(line)
      return chalk.gray(line)
    })
    .join('\n')
  box(colored)
}

function printMonitorSummary(samples: SystemSample[]): void {
  if (samples.length === 0) return

  section('📡 Sistem İzleme')

  const avgCpu = samples.reduce((s, x) => s + x.cpuPercent, 0) / samples.length
  const maxCpu = Math.max(...samples.map((x) => x.cpuPercent))
  const avgRam = samples.reduce((s, x) => s + x.ramPercent, 0) / samples.length
  const maxRam = Math.max(...samples.map((x) => x.ramPercent))

  box(
    [
      `${chalk.cyan.bold('CPU')}  ${progressBar(avgCpu)}  ${chalk.gray(`max ${maxCpu.toFixed(1)}%`)}`,
      `${chalk.magenta.bold('RAM')}  ${progressBar(avgRam)}  ${chalk.gray(`max ${maxRam.toFixed(1)}%`)}`
    ].join('\n'),
    '🖥️ Ortalama Kullanım'
  )

  console.log()
  printTable(
    [chalk.cyan('Zaman'), chalk.cyan('CPU'), chalk.cyan('RAM'), chalk.cyan('Kullanım')],
    samples.map((s) => [
      chalk.gray(s.time),
      progressBar(s.cpuPercent, 10),
      progressBar(s.ramPercent, 10),
      chalk.hex('#a8b2d1')(`${s.ramUsedGB} GB`)
    ])
  )
}

function saveResult(result: autocannon.Result, testType: string, samples?: SystemSample[]): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filePath = join(getConfigDir(), `test-${testType}-${timestamp}.json`)
  writeFileSync(
    filePath,
    JSON.stringify({ type: testType, savedAt: new Date().toISOString(), result, monitoring: samples ?? null }, null, 2),
    'utf8'
  )
  log(`benchmark saved: ${filePath}`)
  return filePath
}

function printJson(result: autocannon.Result, testType: string, samples?: SystemSample[]): void {
  console.log(JSON.stringify({ type: testType, result, monitoring: samples ?? null }, null, 2))
}

async function runWithSpinner<T>(text: string, fn: () => Promise<T>): Promise<T> {
  const spinner = createSpinner(text).start()
  try {
    const result = await fn()
    spinner.stop()
    return result
  } catch (err) {
    spinner.fail(chalk.red(text))
    throw err
  }
}

function showTestWarning(): void {
  box(
    chalk.yellow('Yalnızca kendi sunucularınızı test edin.\n') +
      chalk.gray('Yetkisiz yük testi yasal sorunlara yol açabilir.'),
    '⚠️ Dikkat'
  )
}

async function runWithMonitoring(
  opts: autocannon.Options
): Promise<{ result: autocannon.Result; samples: SystemSample[] }> {
  const samples: SystemSample[] = []
  let interval: ReturnType<typeof setInterval> | undefined

  const result = await new Promise<autocannon.Result>((resolve, reject) => {
    const instance = autocannon(opts, (err, res) => {
      if (interval) clearInterval(interval)
      if (err) reject(err)
      else resolve(res)
    })

    interval = setInterval(async () => {
      try {
        const metrics = await sampleSystemMetrics()
        samples.push({ time: new Date().toLocaleTimeString('tr-TR'), ...metrics })
      } catch {
        // izleme hatası testi durdurmaz
      }
    }, 1000)

    instance.on('done', () => { if (interval) clearInterval(interval) })
    instance.on('error', () => { if (interval) clearInterval(interval) })
  })

  return { result, samples }
}

export async function loadTest(options: TestOptions): Promise<void> {
  if (!options.json) showTestWarning()
  const opts = buildAutocannonOptions(options)

  if (!options.json) {
    printTestBanner('load', {
      url: opts.url,
      sure: `${opts.duration} sn`,
      baglanti: String(opts.connections)
    })
  }

  const { result, samples } = await runWithSpinner(
    `Yük testi çalışıyor (${opts.duration} sn, ${opts.connections} bağlantı)...`,
    () => runWithMonitoring(opts)
  )

  if (options.json) {
    printJson(result, 'load', samples)
  } else {
    printResult(result, 'load')
    if (samples.length > 0) printMonitorSummary(samples)
  }

  if (options.save) success(`Sonuç kaydedildi: ${saveResult(result, 'load', samples)}`)
}

export async function benchmarkTest(options: TestOptions): Promise<void> {
  if (!options.json) showTestWarning()
  const opts = buildAutocannonOptions(options)

  if (!options.json) {
    printTestBanner('benchmark', {
      url: opts.url,
      sure: `${opts.duration} sn`,
      baglanti: String(opts.connections)
    })
  }

  const result = await runWithSpinner(
    `Benchmark çalışıyor (${opts.duration} sn, ${opts.connections} bağlantı)...`,
    () => runTest(opts)
  )

  if (options.json) {
    printJson(result, 'benchmark')
  } else {
    printResult(result, 'benchmark')
    printBenchmarkDetail(result)
  }

  if (options.save) success(`Sonuç kaydedildi: ${saveResult(result, 'benchmark')}`)
}

export async function stressTest(options: TestOptions): Promise<void> {
  if (!options.json) showTestWarning()
  const url = normalizeUrl(options.url)
  const stepDuration = options.duration ?? 5
  const step = options.step ?? 25
  const maxConn = options.maxConnections ?? 200
  let connections = options.connections ?? 10

  if (!options.json) {
    printTestBanner('stress', {
      url,
      sure: `${stepDuration} sn/adım`,
      baglanti: `${connections} → ${maxConn}`,
      extra: `Artış: +${step} bağlantı`
    })
  }

  const phases: Array<{ connections: number; result: autocannon.Result; broken: boolean }> = []

  while (connections <= maxConn) {
    const result = await runWithSpinner(`Stres: ${connections} bağlantı test ediliyor...`, () =>
      runTest({
          url,
          connections,
          duration: stepDuration,
          method: (options.method ?? 'GET') as autocannon.Request['method'],
          pipelining: options.pipelining ?? 1,
          timeout: options.timeout ?? 10
      })
    )

    const rate =
      result.requests.total > 0
        ? (result.errors + result.timeouts + result.non2xx) / result.requests.total
        : 0
    const broken = rate > 0.1

    phases.push({ connections, result, broken })

    if (broken) {
      warn(`%${(rate * 100).toFixed(1)} hata oranı — kırılma noktasına ulaşıldı.`)
      break
    }

    connections += step
  }

  if (options.json) {
    console.log(JSON.stringify({ type: 'stress', url, phases }, null, 2))
    return
  }

  section('💥 Stres Testi Özeti')
  printTable(
    [chalk.magenta('Bağlantı'), chalk.magenta('İstek/sn'), chalk.magenta('Gecikme'), chalk.magenta('Hata'), chalk.magenta('Durum')],
    phases.map(({ connections: c, result, broken }) => [
      chalk.white.bold(String(c)),
      metric(result.requests.average.toFixed(1)),
      latencyColor(result.latency.average),
      statusColor(result.errors + result.timeouts, 'err'),
      broken ? chalk.red.bold('KIRILDI') : chalk.green('OK')
    ])
  )

  const last = phases[phases.length - 1]
  if (last) {
    box(
      [
        `${chalk.gray('Son aşama')}   ${chalk.white.bold(String(last.connections))} bağlantı`,
        `${chalk.gray('Kırılma')}     ${last.broken ? chalk.red.bold('Evet — sunucu limitine ulaşıldı') : chalk.green('Hayır — stabil')}`,
        `${chalk.gray('Aşama')}       ${chalk.cyan(String(phases.length))} test turu`
      ].join('\n'),
      '🎯 Stres Sonucu'
    )
  }

  if (options.save && last) success(`Son aşama kaydedildi: ${saveResult(last.result, 'stress')}`)
}

export async function monitorTest(options: TestOptions): Promise<void> {
  if (!options.json) showTestWarning()
  const opts = buildAutocannonOptions(options)

  if (!options.json) {
    printTestBanner('monitor', {
      url: opts.url,
      sure: `${opts.duration} sn`,
      baglanti: String(opts.connections),
      extra: 'CPU + RAM izleme aktif'
    })
  }

  const { result, samples } = await runWithSpinner(
    `İzleme testi çalışıyor (${opts.duration} sn)...`,
    () => runWithMonitoring(opts)
  )

  if (options.json) {
    printJson(result, 'monitor', samples)
  } else {
    printResult(result, 'monitor')
    printMonitorSummary(samples)
  }

  if (options.save) success(`Sonuç kaydedildi: ${saveResult(result, 'monitor', samples)}`)
}

export async function runTestAction(action: string, url: string, options: TestOptions): Promise<void> {
  if (!url) {
    error('URL gerekli. Örnek: gkatar performans yuk http://localhost:3000 -s 30 -b 20')
    process.exit(1)
  }

  const merged = { ...options, url }

  switch (action) {
    case 'load':
    case 'yuk':
      return loadTest(merged)
    case 'stress':
    case 'stres':
      return stressTest(merged)
    case 'benchmark':
      return benchmarkTest(merged)
    case 'monitor':
    case 'izle':
      return monitorTest(merged)
    default:
      error(`Geçersiz test türü: ${action}`)
      error('Kullanım: yuk | stres | benchmark | izle')
      process.exit(1)
  }
}
