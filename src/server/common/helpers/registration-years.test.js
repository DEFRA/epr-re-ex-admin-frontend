import { yearDetails, registrationYears } from './registration-years.js'

/** @import { RegistrationView } from './fetch-organisation-view.js' */

const today = '2026-10-29'

/** @type {RegistrationView['regAccStatusByDate']} */
const SINCE_2024 = {
  2024: { '2024-03-01': { status: 'registeredOnly' } },
  2025: { '2025-01-01': { status: 'registeredOnly' } },
  2026: { '2026-01-01': { status: 'registeredOnly' } }
}

/**
 * @param {RegistrationView['regAccStatusByDate']} [regAccStatusByDate]
 * @param {RegistrationView['accreditations']} [accreditations]
 * @returns {RegistrationView}
 */
const registration = (
  regAccStatusByDate = SINCE_2024,
  accreditations = {}
) => ({
  material: 'glass',
  wasteProcessingType: 'exporter',
  status: { current: 'approved' },
  regAccStatusByDate,
  accreditations
})

/**
 * @param {string} accreditationNumber
 * @param {string} current
 */
const accreditation = (accreditationNumber, current) => ({
  accreditationNumber,
  status: { current }
})

describe('#yearDetails', () => {
  test.each(['approved', 'suspended'])(
    'gives a year with a %s accreditation as accredited',
    (status) => {
      expect(
        yearDetails(
          registration(undefined, { 2025: accreditation('ACC-25', status) }),
          '2025',
          today
        )
      ).toEqual({
        year: '2025',
        kind: 'accredited',
        accreditation: { accreditationNumber: 'ACC-25', status }
      })
    }
  )

  test.each(['created', 'rejected', 'cancelled'])(
    'gives a registered year with a %s accreditation as registered-only',
    (status) => {
      expect(
        yearDetails(
          registration(undefined, { 2025: accreditation('ACC-25', status) }),
          '2025',
          today
        )
      ).toEqual({
        year: '2025',
        kind: 'registered-only',
        accreditation: null
      })
    }
  )

  test('gives a registered year without an accreditation as registered-only', () => {
    expect(yearDetails(registration(), '2025', today)).toEqual({
      year: '2025',
      kind: 'registered-only',
      accreditation: null
    })
  })

  test('counts a year with an approved day before it was cancelled', () => {
    expect(
      yearDetails(
        registration({
          2025: {
            '2025-01-01': { status: 'accredited' },
            '2025-06-01': { status: 'cancelled' }
          }
        }),
        '2025',
        today
      )?.kind
    ).toBe('registered-only')
  })

  test('gives an accredited year that has not started as accredited', () => {
    expect(
      yearDetails(
        registration(
          { 2027: { '2027-01-01': { status: 'accredited' } } },
          { 2027: accreditation('ACC-27', 'approved') }
        ),
        '2027',
        today
      )?.kind
    ).toBe('accredited')
  })

  test('has no details for a year spent wholly cancelled', () => {
    expect(
      yearDetails(
        registration({ 2025: { '2025-01-01': { status: 'cancelled' } } }),
        '2025',
        today
      )
    ).toBeNull()
  })

  test('has no details for a year that has not started', () => {
    expect(
      yearDetails(
        registration({ 2027: { '2027-01-01': { status: 'accredited' } } }),
        '2027',
        today
      )
    ).toBeNull()
  })

  test.each(['2023', 'constructor'])(
    'has no details for %s, which the registration does not hold',
    (year) => {
      expect(yearDetails(registration(), year, today)).toBeNull()
    }
  )
})

describe('#registrationYears', () => {
  test('lists registered and accredited years newest first', () => {
    expect(
      registrationYears(
        registration(
          {
            ...SINCE_2024,
            2027: { '2027-01-01': { status: 'accredited' } }
          },
          {
            2026: accreditation('ACC-26', 'suspended'),
            2027: accreditation('ACC-27', 'approved')
          }
        ),
        today
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

  test('leaves out a year spent wholly cancelled', () => {
    expect(
      registrationYears(
        registration({
          2024: { '2024-03-01': { status: 'registeredOnly' } },
          2025: { '2025-01-01': { status: 'cancelled' } },
          2026: { '2026-02-01': { status: 'registeredOnly' } }
        }),
        today
      ).map(({ year }) => year)
    ).toEqual(['2026', '2024'])
  })

  test('lists no year for a registration with no status dates', () => {
    expect(registrationYears(registration({}), today)).toEqual([])
  })
})
