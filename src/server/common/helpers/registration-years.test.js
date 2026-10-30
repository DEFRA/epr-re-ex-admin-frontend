import {
  accreditationFor,
  isAccredited,
  registeredYears,
  registrationYears,
  utcToday,
  yearKind
} from './registration-years.js'

/** @import { RegistrationView } from './fetch-organisation-view.js' */

/**
 * @param {string} current
 * @param {{ at: string, status: string }[]} [timeline]
 * @param {RegistrationView['accreditations']} [accreditations]
 * @returns {RegistrationView}
 */
const registration = (current, timeline = [], accreditations = {}) => ({
  material: 'glass',
  wasteProcessingType: 'exporter',
  validFrom: '2024-03-01',
  status: { current, timeline },
  accreditations
})

describe('#utcToday', () => {
  test('is a calendar date', () => {
    expect(utcToday()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('#registeredYears', () => {
  const today = '2026-10-29'

  test('runs from validFrom to this year while approved', () => {
    expect(registeredYears(registration('approved'), today)).toEqual([
      2024, 2025, 2026
    ])
  })

  test('runs from validFrom to the year it was cancelled', () => {
    expect(
      registeredYears(
        registration('cancelled', [
          { at: '2024-03-01T00:00:00.000Z', status: 'approved' },
          { at: '2025-06-01T00:00:00.000Z', status: 'cancelled' }
        ]),
        today
      )
    ).toEqual([2024, 2025])
  })

  test('runs to this year for a cancellation without a timeline', () => {
    expect(registeredYears(registration('cancelled'), today)).toEqual([
      2024, 2025, 2026
    ])
  })
})

describe('#isAccredited', () => {
  /** @param {string} current */
  const accreditedIn2025 = (current) =>
    registration('approved', [], {
      2025: {
        accreditationNumber: 'ACC-25',
        status: { current }
      }
    })

  test.each(['approved', 'suspended'])(
    'counts a %s accreditation',
    (status) => {
      expect(isAccredited(accreditedIn2025(status), '2025')).toBe(true)
    }
  )

  test('does not count a cancelled accreditation', () => {
    expect(isAccredited(accreditedIn2025('cancelled'), 2025)).toBe(false)
  })

  test.each(['2026', 'constructor'])(
    'does not count %s, which has no accreditation',
    (year) => {
      expect(isAccredited(accreditedIn2025('approved'), year)).toBe(false)
    }
  )
})

describe('#accreditationFor', () => {
  /** @param {string} current */
  const accreditedIn2025 = (current) =>
    registration('approved', [], {
      2025: { accreditationNumber: 'ACC-25', status: { current } }
    })

  test("returns the year's accreditation with its current status", () => {
    expect(accreditationFor(accreditedIn2025('approved'), '2025')).toEqual({
      year: '2025',
      accreditationNumber: 'ACC-25',
      status: 'approved'
    })
  })

  test('returns null for a year without one', () => {
    expect(accreditationFor(accreditedIn2025('approved'), '2026')).toBeNull()
  })

  test('returns null for an accreditation not approved or suspended', () => {
    expect(accreditationFor(accreditedIn2025('cancelled'), '2025')).toBeNull()
  })
})

describe('#yearKind', () => {
  const today = '2026-10-29'
  const accreditedIn2026 = registration('approved', [], {
    2026: { accreditationNumber: 'ACC-26', status: { current: 'approved' } },
    2027: { accreditationNumber: 'ACC-27', status: { current: 'approved' } }
  })

  test.each([
    ['2026', 'accredited'],
    ['2027', 'accredited'],
    ['2025', 'registered-only'],
    ['2023', null]
  ])('gives %s as %s', (year, kind) => {
    expect(yearKind(accreditedIn2026, year, today)).toBe(kind)
  })
})

describe('#registrationYears', () => {
  const today = '2026-10-29'
  /**
   * @param {string} accreditationNumber
   * @param {string} current
   */
  const accreditation = (accreditationNumber, current) => ({
    accreditationNumber,
    status: { current, timeline: [] }
  })

  test('lists registered and accredited years newest first', () => {
    expect(
      registrationYears(
        registration('approved', [], {
          2026: accreditation('ACC-26', 'suspended'),
          2027: accreditation('ACC-27', 'approved')
        }),
        today
      )
    ).toEqual([
      {
        year: '2027',
        kind: 'accredited',
        accreditation: {
          year: '2027',
          accreditationNumber: 'ACC-27',
          status: 'approved'
        }
      },
      {
        year: '2026',
        kind: 'accredited',
        accreditation: {
          year: '2026',
          accreditationNumber: 'ACC-26',
          status: 'suspended'
        }
      },
      { year: '2025', kind: 'registered-only', accreditation: null },
      { year: '2024', kind: 'registered-only', accreditation: null }
    ])
  })

  test.each(['created', 'rejected', 'cancelled'])(
    'leaves out a %s accreditation',
    (status) => {
      expect(
        registrationYears(
          registration('approved', [], {
            2025: accreditation('ACC-25', status),
            2027: accreditation('ACC-27', status)
          }),
          today
        ).map(({ year, accreditation }) => [year, accreditation])
      ).toEqual([
        ['2026', null],
        ['2025', null],
        ['2024', null]
      ])
    }
  )
})
