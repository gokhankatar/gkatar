import chalk from 'chalk'
import boxen from 'boxen'
import gradient from 'gradient-string'
import Table from 'cli-table3'

const brand = gradient(['#00d4ff', '#7b2ff7', '#f107a3'])

export const banner = (): void => {
  const art = brand.multiline(`
   ██████╗ ██╗  ██╗ █████╗ ████████╗ █████╗ ██████╗ 
  ██╔════╝ ██║ ██╔╝██╔══██╗╚══██╔══╝██╔══██╗██╔══██╗
  ██║  ███╗█████╔╝ ███████║   ██║   ███████║██████╔╝
  ██║   ██║██╔═██╗ ██╔══██║   ██║   ██╔══██║██╔══██╗
  ╚██████╔╝██║  ██╗██║  ██║   ██║   ██║  ██║██║  ██║
   ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝`)
  console.log(art)
  console.log(chalk.gray('  Windows sistem yönetim & geliştirici araç kutusu · Gökhan Katar\n'))
}

export const title = (text: string, icon = '▸'): void => {
  console.log(brand(`${icon} ${text}`))
  console.log(chalk.hex('#444')(  '─'.repeat(Math.min(text.length + 6, 50))))
}

export const section = (text: string): void => {
  console.log(chalk.bold.magenta(`\n  ${text}`))
}

export const success = (text: string) => console.log(chalk.green(`  ✔ ${text}`))
export const warn = (text: string) => console.log(chalk.yellow(`  ⚠ ${text}`))
export const error = (text: string) => console.log(chalk.red(`  ✖ ${text}`))
export const info = (text: string) => console.log(chalk.blue(`  ℹ ${text}`))
export const dim = (text: string) => console.log(chalk.gray(`  ${text}`))

export const label = (key: string, value: string): void => {
  console.log(`  ${chalk.white.bold(key.padEnd(20))} ${chalk.hex('#a8b2d1')(value)}`)
}

export const box = (content: string, title?: string): void => {
  console.log(
    boxen(content, {
      title: title ? chalk.cyan(title) : undefined,
      padding: 1,
      margin: { top: 0, bottom: 1, left: 0, right: 0 },
      borderStyle: 'round',
      borderColor: 'cyan'
    })
  )
}

export const highlight = (text: string): string => chalk.cyan.bold(text)
export const cmd = (text: string): string => chalk.yellow(text)

export function createTable(head: string[]): Table.Table {
  return new Table({
    head: head.map((h) => chalk.cyan.bold(h)),
    style: { head: [], border: ['gray'] },
    chars: {
      top: '─', 'top-mid': '┬', 'top-left': '┌', 'top-right': '┐',
      bottom: '─', 'bottom-mid': '┴', 'bottom-left': '└', 'bottom-right': '┘',
      left: '│', 'left-mid': '├', mid: '─', 'mid-mid': '┼',
      right: '│', 'right-mid': '┤', middle: '│'
    }
  })
}

export function printTable(head: string[], rows: string[][]): void {
  const table = createTable(head)
  table.push(...rows)
  console.log(table.toString())
}

export const divider = (): void => console.log(chalk.hex('#333')('  ' + '·'.repeat(48)))
