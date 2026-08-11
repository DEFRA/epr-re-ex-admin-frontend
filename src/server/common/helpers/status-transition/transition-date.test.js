import { parseTransitionDate } from './transition-date.js'

describe('parseTransitionDate', () => {
  test('reads the date parts under the given name prefix', () => {
    const payload = {
      'validFrom-day': '1',
      'validFrom-month': '8',
      'validFrom-year': '2026',
      'validTo-day': '31',
      'validTo-month': '12',
      'validTo-year': '2027'
    }

    expect(parseTransitionDate(payload, 'validFrom', 'from error')).toEqual({
      day: '1',
      month: '8',
      year: '2026',
      isoDate: '2026-08-01',
      error: undefined
    })
    expect(parseTransitionDate(payload, 'validTo', 'to error')).toEqual({
      day: '31',
      month: '12',
      year: '2027',
      isoDate: '2027-12-31',
      error: undefined
    })
  })

  test('trims surrounding whitespace from each part', () => {
    const result = parseTransitionDate(
      {
        'validFrom-day': ' 1 ',
        'validFrom-month': ' 8 ',
        'validFrom-year': ' 2026 '
      },
      'validFrom',
      'from error'
    )

    expect(result).toEqual({
      day: '1',
      month: '8',
      year: '2026',
      isoDate: '2026-08-01',
      error: undefined
    })
  })

  test('returns the caller error and empty parts when the date is absent', () => {
    expect(
      parseTransitionDate({}, 'validTo', 'Enter the valid to date')
    ).toEqual({
      day: '',
      month: '',
      year: '',
      isoDate: null,
      error: 'Enter the valid to date'
    })
  })

  test.each([
    ['a missing day', { 'validFrom-month': '8', 'validFrom-year': '2026' }],
    [
      'a non-numeric month',
      {
        'validFrom-day': '1',
        'validFrom-month': 'August',
        'validFrom-year': '2026'
      }
    ],
    [
      'a two-digit year',
      { 'validFrom-day': '1', 'validFrom-month': '8', 'validFrom-year': '26' }
    ],
    [
      'a date that does not exist',
      {
        'validFrom-day': '30',
        'validFrom-month': '2',
        'validFrom-year': '2026'
      }
    ]
  ])(
    'returns the caller error for %s, preserving what was typed',
    (_label, payload) => {
      const result = parseTransitionDate(
        payload,
        'validFrom',
        'Enter the valid from date'
      )

      expect(result.isoDate).toBeNull()
      expect(result.error).toBe('Enter the valid from date')
      expect(result.day).toBe(payload['validFrom-day'] ?? '')
      expect(result.month).toBe(payload['validFrom-month'] ?? '')
      expect(result.year).toBe(payload['validFrom-year'] ?? '')
    }
  )
})
