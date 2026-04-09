import type { BirthDateInput, MatrixData } from '../types/matrix'

function reduceTo22(num: number): number {
  if (!num) {
    return 0
  }

  let sum = num
  while (sum > 22) {
    sum = sum
      .toString()
      .split('')
      .reduce((acc, digit) => acc + Number.parseInt(digit, 10), 0)
  }

  return sum
}

export function calculateDestinyMatrix({ day, month, year }: BirthDateInput): MatrixData {
  const A = reduceTo22(day)
  const B = reduceTo22(month)
  const ySum = year
    .toString()
    .split('')
    .reduce((acc, digit) => acc + Number.parseInt(digit, 10), 0)

  const C = reduceTo22(ySum)
  const D = reduceTo22(A + B + C)
  const E = reduceTo22(A + B + C + D)

  const TL = reduceTo22(A + B)
  const BR = reduceTo22(C + D)
  const TR = reduceTo22(B + C)
  const BL = reduceTo22(A + D)

  const sky = reduceTo22(B + D)
  const earth = reduceTo22(A + C)
  const personalPurpose = reduceTo22(sky + earth)

  const maleLine = reduceTo22(TL + BR)
  const femaleLine = reduceTo22(TR + BL)
  const socialPurpose = reduceTo22(maleLine + femaleLine)

  const spiritualPurpose = reduceTo22(personalPurpose + socialPurpose)

  return {
    A,
    B,
    C,
    D,
    E,
    TL,
    TR,
    BL,
    BR,
    personalPurpose,
    socialPurpose,
    spiritualPurpose,
  }
}
