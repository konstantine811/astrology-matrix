import type { BirthDateInput } from '../types/matrix'

export type MatrixModelTableRow = [string, string, string, string]

export type MatrixModelTable = {
  rows: MatrixModelTableRow[]
}

function sumDigits(value: number): number {
  return value
    .toString()
    .split('')
    .reduce((acc, digit) => acc + Number.parseInt(digit, 10), 0)
}

function reduceToSingleDigit(value: number): number {
  let result = Math.abs(value)
  while (result > 9) {
    result = sumDigits(result)
  }
  return result
}

function countDigitsFromDigitGroups(digitGroups: number[][]): Record<number, number> {
  const counts: Record<number, number> = {
    0: 0,
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
    8: 0,
    9: 0,
  }

  digitGroups
    .flat()
    .forEach((digit) => {
      counts[digit] += 1
    })

  return counts
}

function repeatDigit(digit: number, count: number): string {
  if (count === 0) {
    return '-'
  }

  if (digit === 6) {
    return `${'6'.repeat(count)}(6)`
  }

  const repeated = String(digit).repeat(count)
  if ((digit === 1 || digit === 7) && count > 1) {
    return `${repeated}(${digit})`
  }

  return repeated
}

function formatZeroCell(zeroCount: number): string {
  const repeatedZeros = '0'.repeat(Math.max(1, zeroCount))
  return `${repeatedZeros}(0)`
}

function formatLineMetric(digits: number[], counts: Record<number, number>): string {
  const weightedTotal = digits.reduce((acc, digit) => acc + digit * counts[digit], 0)
  if (weightedTotal === 0) {
    return '-'
  }

  const reduced = reduceToSingleDigit(weightedTotal)
  const rowKeyDigit = digits.find((digit) => counts[digit] > 0) ?? digits[0]

  return `${reduced}(${rowKeyDigit})`
}

export function buildMatrixModelTable({ day, month, year }: BirthDateInput): MatrixModelTable {
  const dayStr = String(day).padStart(2, '0')
  const monthStr = String(month).padStart(2, '0')
  const yearStr = String(year)

  const dateDigits = `${dayStr}${monthStr}${yearStr}`
    .split('')
    .map((digit) => Number.parseInt(digit, 10))

  const calc1 = dateDigits.reduce((acc, digit) => acc + digit, 0)
  const calc2 = sumDigits(calc1)
  const firstDayDigit = Number.parseInt(dayStr[0], 10)
  const calc3 = calc1 - firstDayDigit * 2
  const calc4 = sumDigits(calc3)

  // For matrix fill, method uses date digits + only 1..4 calculated numbers.
  const counts = countDigitsFromDigitGroups([
    dateDigits,
    calc1.toString().split('').map((digit) => Number.parseInt(digit, 10)),
    calc2.toString().split('').map((digit) => Number.parseInt(digit, 10)),
    calc3.toString().split('').map((digit) => Number.parseInt(digit, 10)),
    calc4.toString().split('').map((digit) => Number.parseInt(digit, 10)),
  ])

  return {
    rows: [
      [String(calc2), formatZeroCell(counts[0]), String(calc4), ''],
      [
        repeatDigit(1, counts[1]),
        repeatDigit(2, counts[2]),
        repeatDigit(3, counts[3]),
        formatLineMetric([1, 2, 3], counts),
      ],
      [
        repeatDigit(4, counts[4]),
        repeatDigit(5, counts[5]),
        repeatDigit(6, counts[6]),
        formatLineMetric([4, 5, 6], counts),
      ],
      [
        repeatDigit(7, counts[7]),
        repeatDigit(8, counts[8]),
        repeatDigit(9, counts[9]),
        formatLineMetric([7, 8, 9], counts),
      ],
      [String(calc2), '-', '-', String(calc2)],
    ],
  }
}
