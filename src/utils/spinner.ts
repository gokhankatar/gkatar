import ora, { type Ora } from 'ora'
import chalk from 'chalk'

const SPINNERS = ['dots12', 'arc', 'triangle', 'bouncingBar'] as const
let spinnerIndex = 0

function nextSpinner(): (typeof SPINNERS)[number] {
  const s = SPINNERS[spinnerIndex % SPINNERS.length]!
  spinnerIndex++
  return s
}

export function createSpinner(text: string): Ora {
  return ora({
    text: chalk.cyan(text),
    spinner: nextSpinner(),
    color: 'cyan',
    prefixText: chalk.gray('  ')
  })
}

export async function withSpinner<T>(text: string, fn: () => Promise<T>): Promise<T> {
  const spinner = createSpinner(text).start()
  try {
    const result = await fn()
    spinner.succeed(chalk.green(text))
    return result
  } catch (err) {
    spinner.fail(chalk.red(text))
    throw err
  }
}
