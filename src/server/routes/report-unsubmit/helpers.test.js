import { formatPeriod } from './helpers.js'

describe('formatPeriod', () => {
  test.each([
    ['1', 'monthly', 'January'],
    ['6', 'monthly', 'June'],
    ['12', 'monthly', 'December'],
    ['1', 'quarterly', 'Quarter 1'],
    ['4', 'quarterly', 'Quarter 4'],
    ['2', 'annual', 'Annual 2']
  ])('formatPeriod(%s, %s) → %s', (period, cadence, expected) => {
    expect(formatPeriod(period, cadence)).toBe(expected)
  })
})
