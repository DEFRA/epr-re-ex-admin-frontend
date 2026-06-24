import { describe, test, expect } from 'vitest'
import { toCsvNumber } from './to-csv-number.js'

describe('toCsvNumber', () => {
  test('returns a genuine number unchanged', () => {
    expect(toCsvNumber(100.5)).toBe(100.5)
    expect(toCsvNumber(0)).toBe(0)
    expect(toCsvNumber(-12.5)).toBe(-12.5)
  })

  test('coerces a numeric string to a number', () => {
    expect(toCsvNumber('100.5')).toBe(100.5)
    expect(toCsvNumber('0')).toBe(0)
    expect(toCsvNumber('4500')).toBe(4500)
  })

  test('returns an empty string for blank, null or undefined', () => {
    expect(toCsvNumber('')).toBe('')
    expect(toCsvNumber(null)).toBe('')
    expect(toCsvNumber(undefined)).toBe('')
  })

  test('returns an empty string for a non-numeric value', () => {
    expect(toCsvNumber('not a number')).toBe('')
  })

  test('strips floating-point representation noise from arithmetic', () => {
    expect(toCsvNumber(1234.56 + 5678.9)).toBe(6913.46)
    expect(toCsvNumber(0.1 + 0.2)).toBe(0.3)
  })
})
