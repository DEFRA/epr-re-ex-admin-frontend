import { describe, test, expect } from 'vitest'
import { roundForCsv } from './round-for-csv.js'

describe('roundForCsv', () => {
  test('rounds a number to the requested decimal places', () => {
    expect(roundForCsv(1234.567, 2)).toBe(1234.57)
    expect(roundForCsv(1234.567, 0)).toBe(1235)
    expect(roundForCsv(50, 2)).toBe(50)
  })

  test('coerces a numeric string before rounding', () => {
    expect(roundForCsv('100.5', 2)).toBe(100.5)
    expect(roundForCsv('4500', 0)).toBe(4500)
  })

  test('returns an empty string for blank, null or undefined', () => {
    expect(roundForCsv('', 2)).toBe('')
    expect(roundForCsv(null, 2)).toBe('')
    expect(roundForCsv(undefined, 2)).toBe('')
  })

  test('returns an empty string for a non-numeric value', () => {
    expect(roundForCsv('not a number', 2)).toBe('')
  })

  test('strips floating-point representation noise when rounding', () => {
    expect(roundForCsv(1234.56 + 5678.9, 2)).toBe(6913.46)
    expect(roundForCsv(0.1 + 0.2, 2)).toBe(0.3)
  })
})
