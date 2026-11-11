import { yearDetails, registrationYears } from './registration-years.js'

/** @import { AccreditationStatus, RegistrationView } from './fetch-organisation-view.js' */

/** @type {RegistrationView['regAccStatusByDate']} */
const SINCE_2024 = {
  2024: { '2024-03-01': { status: 'registeredOnly' } },
  2025: { '2025-01-01': { status: 'registeredOnly' } },
  2026: { '2026-01-01': { status: 'registeredOnly' } }
}

/**
 * @param {{
 *   regAccStatusByDate?: RegistrationView['regAccStatusByDate'],
 *   accreditations?: RegistrationView['accreditations']
 * }} [overrides]
 * @returns {RegistrationView}
 */
const registration = ({
  regAccStatusByDate = SINCE_2024,
  accreditations = {}
} = {}) => ({
  material: 'glass',
  wasteProcessingType: 'exporter',
  status: { current: 'approved' },
  regAccStatusByDate,
  accreditations
})

/**
 * @param {string} accreditationNumber
 * @param {AccreditationStatus} current
 */
const accreditation = (accreditationNumber, current) => ({
  accreditationNumber,
  status: { current }
})

/** @type {AccreditationStatus[]} */
const ACTIVE = ['approved', 'suspended']

/** @type {AccreditationStatus[]} */
const INACTIVE = ['created', 'rejected', 'cancelled']

describe('#yearDetails', () => {
  test.each(ACTIVE)(
    'gives a year with a %s accreditation as accredited',
    (status) => {
      expect(
        yearDetails(
          registration({
            accreditations: { 2025: accreditation('ACC-25', status) }
          }),
          '2025'
        )
      ).toEqual({
        year: '2025',
        kind: 'accredited',
        accreditation: { accreditationNumber: 'ACC-25', status }
      })
    }
  )

  test.each(INACTIVE)(
    'gives a registered year with a %s accreditation as registered-only',
    (status) => {
      expect(
        yearDetails(
          registration({
            accreditations: { 2025: accreditation('ACC-25', status) }
          }),
          '2025'
        )
      ).toEqual({
        year: '2025',
        kind: 'registered-only',
        accreditation: null
      })
    }
  )

  test('gives a registered year without an accreditation as registered-only', () => {
    expect(yearDetails(registration(), '2025')).toEqual({
      year: '2025',
      kind: 'registered-only',
      accreditation: null
    })
  })

  test('counts a year with an approved day before it was cancelled', () => {
    expect(
      yearDetails(
        registration({
          regAccStatusByDate: {
            2025: {
              '2025-01-01': { status: 'accredited' },
              '2025-06-01': { status: 'cancelled' }
            }
          }
        }),
        '2025'
      )?.kind
    ).toBe('registered-only')
  })

  test('gives an accredited year that has not started as accredited', () => {
    expect(
      yearDetails(
        registration({
          regAccStatusByDate: {
            2027: { '2027-01-01': { status: 'accredited' } }
          },
          accreditations: { 2027: accreditation('ACC-27', 'approved') }
        }),
        '2027'
      )?.kind
    ).toBe('accredited')
  })

  test('has no details for a year spent wholly cancelled', () => {
    expect(
      yearDetails(
        registration({
          regAccStatusByDate: {
            2025: { '2025-01-01': { status: 'cancelled' } }
          }
        }),
        '2025'
      )
    ).toBeNull()
  })

  test('gives a registered-only year that has not started as the backend serves it', () => {
    expect(
      yearDetails(
        registration({
          regAccStatusByDate: {
            2027: { '2027-01-01': { status: 'registeredOnly' } }
          }
        }),
        '2027'
      )?.kind
    ).toBe('registered-only')
  })

  test.each(['2023', 'constructor'])(
    'has no details for %s, which the backend does not serve',
    (year) => {
      expect(yearDetails(registration(), year)).toBeNull()
    }
  )
})

describe('#registrationYears', () => {
  test('lists registered and accredited years newest first', () => {
    expect(
      registrationYears(
        registration({
          regAccStatusByDate: {
            ...SINCE_2024,
            2027: { '2027-01-01': { status: 'accredited' } }
          },
          accreditations: {
            2026: accreditation('ACC-26', 'suspended'),
            2027: accreditation('ACC-27', 'approved')
          }
        })
      )
    ).toEqual([
      {
        year: '2027',
        kind: 'accredited',
        accreditation: { accreditationNumber: 'ACC-27', status: 'approved' }
      },
      {
        year: '2026',
        kind: 'accredited',
        accreditation: { accreditationNumber: 'ACC-26', status: 'suspended' }
      },
      { year: '2025', kind: 'registered-only', accreditation: null },
      { year: '2024', kind: 'registered-only', accreditation: null }
    ])
  })

  test('leaves out an accreditation for a year the backend does not serve', () => {
    expect(
      registrationYears(
        registration({
          accreditations: { 2027: accreditation('ACC-27', 'approved') }
        })
      ).map(({ year }) => year)
    ).toEqual(['2026', '2025', '2024'])
  })

  test('leaves out a year spent wholly cancelled', () => {
    expect(
      registrationYears(
        registration({
          regAccStatusByDate: {
            2024: { '2024-03-01': { status: 'registeredOnly' } },
            2025: { '2025-01-01': { status: 'cancelled' } },
            2026: { '2026-02-01': { status: 'registeredOnly' } }
          }
        })
      ).map(({ year }) => year)
    ).toEqual(['2026', '2024'])
  })

  test('lists no year for a registration with no status dates', () => {
    expect(registrationYears(registration({ regAccStatusByDate: {} }))).toEqual(
      []
    )
  })
})
