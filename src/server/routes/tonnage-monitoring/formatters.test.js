import { describe, it, expect } from 'vitest'
import { formatTonnage } from './formatters.js'

describe('formatTonnage', () => {
  it('should format a positive number to 2 decimal places', () => {
    expect(formatTonnage(1234.567)).toBe('1234.57')
    expect(formatTonnage(50)).toBe('50.00')
  })

  it('should format zero as "0.00"', () => {
    expect(formatTonnage(0)).toBe('0.00')
  })

  it('should return an empty string for null', () => {
    expect(formatTonnage(null)).toBe('')
  })

  it('should return an empty string for undefined', () => {
    expect(formatTonnage(undefined)).toBe('')
  })

  it('should handle negative numbers', () => {
    expect(formatTonnage(-10.5)).toBe('-10.50')
  })
})

describe('formatTonnage', () => {
  it('should format a positive number to 2 decimal places', () => {
    expect(formatTonnage(1234.567)).toBe('1234.57')
    expect(formatTonnage(50)).toBe('50.00')
  })

  it('should format zero as "0.00"', () => {
    expect(formatTonnage(0)).toBe('0.00')
  })

  it('should return an empty string for null', () => {
    expect(formatTonnage(null)).toBe('')
  })

  it('should return an empty string for undefined', () => {
    expect(formatTonnage(undefined)).toBe('')
  })

  it('should handle negative numbers', () => {
    expect(formatTonnage(-10.5)).toBe('-10.50')
  })
})
