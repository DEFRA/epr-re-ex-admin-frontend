import { describe, test, expect } from 'vitest'
import { formatDateTime } from './formatters.js'

describe('formatters', () => {
  describe('formatDateTime', () => {
    test('formats ISO date string to British date/time format', () => {
      expect(formatDateTime('2026-02-06T14:30:00.000Z')).toBe(
        '6 February 2026 at 2:30pm'
      )
      expect(formatDateTime('2026-01-15T10:30:00.000Z')).toBe(
        '15 January 2026 at 10:30am'
      )
      expect(formatDateTime('2026-12-25T23:45:00.000Z')).toBe(
        '25 December 2026 at 11:45pm'
      )
      expect(formatDateTime('2026-03-05T05:05:00.000Z')).toBe(
        '5 March 2026 at 5:05am'
      )
    })

    test('returns empty string when given empty string', () => {
      const result = formatDateTime('')
      expect(result).toBe('')
    })

    test('returns empty string when given null', () => {
      const result = formatDateTime(null)
      expect(result).toBe('')
    })
  })
})
