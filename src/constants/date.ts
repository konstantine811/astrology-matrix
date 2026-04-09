export const MONTHS_UA = [
  'Січ',
  'Лют',
  'Бер',
  'Квіт',
  'Трав',
  'Черв',
  'Лип',
  'Серп',
  'Вер',
  'Жовт',
  'Лист',
  'Груд',
] as const

export const DEFAULT_BIRTH_YEAR = 1990

export function createYearOptions(totalYears = 100): string[] {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: totalYears }, (_, i) => String(currentYear - i))
}

export function createDayOptions(monthIndex: number, year: number): string[] {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  return Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, '0'))
}
