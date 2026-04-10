import type { BirthDateInput } from '../types/matrix'

export type MatrixModelTableRow = [string, string, string, string]

export const MATRIX_COLUMN_LABELS = [
  'Особиста програма',
  'Колективна програма',
  'Суспільна програма',
  'Імідж (як нас бачать інші)',
] as const

export const MATRIX_ROW_LABELS = [
  'Базові розрахункові показники',
  'Потенціали особистого прояву (форма)',
  "Потенціали для взаємодії з іншими людьми (зв'язки)",
  'Потенціали для прояву в діяльності (управління)',
  'Потенціали для перехідних процесів між системами (синтез)',
] as const

export const MATRIX_ROW_TIME_LABELS = [
  null,
  'Минуле',
  'Теперішнє',
  'Майбутнє',
  'Синтез',
] as const

export type MatrixParsedCell = {
  rowIndex: number
  colIndex: number
  rawValue: string
  energy: number | null
  mainCount: number
  bracketCount: number
  rowLabel: string
  columnLabel: string
  timeLabel: string | null
}

export type MatrixModelTable = {
  rows: MatrixModelTableRow[]
}

function sumDigits(value: number): number {
  return value
    .toString()
    .split('')
    .reduce((acc, digit) => acc + Number.parseInt(digit, 10), 0)
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

function countSpecialValues(values: number[]): Record<10 | 11 | 12, number> {
  const counts: Record<10 | 11 | 12, number> = {
    10: 0,
    11: 0,
    12: 0,
  }

  values.forEach((value) => {
    if (value === 10 || value === 11 || value === 12) {
      counts[value] += 1
    }
  })

  return counts
}

function toDigitsForMatrix(value: number): number[] {
  const abs = Math.abs(value)
  // From the method: 11 from the calculated row is never split into separate ones.
  if (abs === 11) {
    return []
  }

  return abs
    .toString()
    .split('')
    .map((digit) => Number.parseInt(digit, 10))
}

function repeatToken(token: string, count: number): string {
  return Array.from({ length: count }, () => token).join(' ')
}

function formatDigitCell(digit: number, mainCount: number, bracketCount: number): string {
  const mainPart = mainCount > 0 ? String(digit).repeat(mainCount) : '-'
  if (bracketCount === 0) {
    return mainPart
  }

  const bracketPart = `(${String(digit).repeat(bracketCount)})`
  if (mainPart === '-') {
    return bracketPart
  }

  return `${mainPart}${bracketPart}`
}

function formatSpecialCell(value: 10 | 11 | 12, mainCount: number, bracketCount: number): string {
  const mainPart = mainCount > 0 ? repeatToken(String(value), mainCount) : '-'
  if (bracketCount === 0) {
    return mainPart
  }

  const bracketPart = `(${repeatToken(String(value), bracketCount)})`
  if (mainPart === '-') {
    return bracketPart
  }

  return `${mainPart}${bracketPart}`
}

function normalizeMetric(value: number): number | null {
  if (value <= 0) return null
  if (value === 10 || value === 11 || value === 12) return value

  let result = value
  while (result > 12) {
    result = sumDigits(result)
    if (result === 10 || result === 11 || result === 12) {
      return result
    }
  }

  return result
}

function formatSigma(mainValue: number | null, bracketValue: number | null): string {
  if (mainValue === null && bracketValue === null) {
    return '-'
  }

  if (mainValue === null && bracketValue !== null) {
    return `Σ (${bracketValue})`
  }

  if (mainValue !== null && bracketValue === null) {
    return `Σ ${mainValue}`
  }

  return `Σ ${mainValue}(${bracketValue})`
}

function weightedSumByDigits(digits: number[], counts: Record<number, number>): number {
  return digits.reduce((acc, digit) => acc + digit * counts[digit], 0)
}

function weightedSumBySpecials(
  values: Array<10 | 11 | 12>,
  counts: Record<10 | 11 | 12, number>,
): number {
  return values.reduce((acc, value) => acc + value * counts[value], 0)
}

export function parseMatrixCell(rowIndex: number, colIndex: number, rawValue: string): MatrixParsedCell {
  const trimmed = rawValue.trim()
  const sigmaMatch = trimmed.match(/^Σ\s*(\d{1,2})/)
  const repeatedWithOptionalBracketMatch = trimmed.match(/^(\d)\1*(?:\((\d+)\))?$/)
  const directNumberMatch = trimmed.match(/^(\d{1,2})$/)
  const multiSpecialMatch = trimmed.match(/^(\d{1,2})(?:\s+\d{1,2})+(?:\((\d{1,2})\))?$/)
  const bracketOnlyMatch = trimmed.match(/^\((\d+)\)$/)

  const energy = sigmaMatch
    ? Number.parseInt(sigmaMatch[1], 10)
    : repeatedWithOptionalBracketMatch
      ? Number.parseInt(repeatedWithOptionalBracketMatch[1], 10)
      : directNumberMatch
        ? Number.parseInt(directNumberMatch[1], 10)
        : multiSpecialMatch
          ? Number.parseInt(multiSpecialMatch[1], 10)
          : bracketOnlyMatch
            ? Number.parseInt(bracketOnlyMatch[1], 10)
            : null

  const bracketPart = trimmed.match(/\(([^)]+)\)/)?.[1] ?? ''
  const mainPart = trimmed.replace(/\([^)]*\)/g, '').replace(/^Σ\s*\d{1,2}/, '').trim()

  const countForEnergy = (target: number, source: string): number => {
    if (!source) return 0

    if (target >= 10) {
      return source
        .split(/\s+/)
        .filter((token) => token === String(target)).length
    }

    return source
      .split('')
      .filter((char) => char === String(target)).length
  }

  const mainCount = energy === null ? 0 : countForEnergy(energy, mainPart)
  const bracketCount = energy === null ? 0 : countForEnergy(energy, bracketPart)

  return {
    rowIndex,
    colIndex,
    rawValue,
    energy,
    mainCount,
    bracketCount,
    rowLabel: MATRIX_ROW_LABELS[rowIndex] ?? `Ряд ${rowIndex + 1}`,
    columnLabel: MATRIX_COLUMN_LABELS[colIndex] ?? `Стовпець ${colIndex + 1}`,
    timeLabel: MATRIX_ROW_TIME_LABELS[rowIndex] ?? null,
  }
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
  const calc5 = calc1 + calc3
  const calc6 = calc2 + calc4

  // Main matrix digits are formed from birth date + 1..4 calculated numbers.
  const mainCalculated = [calc1, calc2, calc3, calc4]
  const mainCounts = countDigitsFromDigitGroups([
    dateDigits,
    ...mainCalculated.map(toDigitsForMatrix),
  ])
  const mainSpecialCounts = countSpecialValues(mainCalculated)

  // 5th and 6th calculated numbers are added in brackets.
  const bracketCalculated = [calc5, calc6]
  const bracketCounts = countDigitsFromDigitGroups(bracketCalculated.map(toDigitsForMatrix))
  const bracketSpecialCounts = countSpecialValues(bracketCalculated)

  const sigma123Main = normalizeMetric(weightedSumByDigits([1, 2, 3], mainCounts))
  const sigma456Main = normalizeMetric(weightedSumByDigits([4, 5, 6], mainCounts))
  const sigma789Main = normalizeMetric(weightedSumByDigits([7, 8, 9], mainCounts))
  const sigma101112Main = normalizeMetric(weightedSumBySpecials([10, 11, 12], mainSpecialCounts))

  const sigma123Bracket = normalizeMetric(weightedSumByDigits([1, 2, 3], bracketCounts))
  const sigma456Bracket = normalizeMetric(weightedSumByDigits([4, 5, 6], bracketCounts))
  const sigma789Bracket = normalizeMetric(weightedSumByDigits([7, 8, 9], bracketCounts))
  const sigma101112Bracket = normalizeMetric(
    weightedSumBySpecials([10, 11, 12], bracketSpecialCounts),
  )

  return {
    rows: [
      [
        String(calc2),
        formatDigitCell(0, mainCounts[0], bracketCounts[0]),
        String(calc4),
        '',
      ],
      [
        formatDigitCell(1, mainCounts[1], bracketCounts[1]),
        formatDigitCell(2, mainCounts[2], bracketCounts[2]),
        formatDigitCell(3, mainCounts[3], bracketCounts[3]),
        formatSigma(sigma123Main, sigma123Bracket),
      ],
      [
        formatDigitCell(4, mainCounts[4], bracketCounts[4]),
        formatDigitCell(5, mainCounts[5], bracketCounts[5]),
        formatDigitCell(6, mainCounts[6], bracketCounts[6]),
        formatSigma(sigma456Main, sigma456Bracket),
      ],
      [
        formatDigitCell(7, mainCounts[7], bracketCounts[7]),
        formatDigitCell(8, mainCounts[8], bracketCounts[8]),
        formatDigitCell(9, mainCounts[9], bracketCounts[9]),
        formatSigma(sigma789Main, sigma789Bracket),
      ],
      [
        formatSpecialCell(10, mainSpecialCounts[10], bracketSpecialCounts[10]),
        formatSpecialCell(11, mainSpecialCounts[11], bracketSpecialCounts[11]),
        formatSpecialCell(12, mainSpecialCounts[12], bracketSpecialCounts[12]),
        formatSigma(sigma101112Main, sigma101112Bracket),
      ],
    ],
  }
}
