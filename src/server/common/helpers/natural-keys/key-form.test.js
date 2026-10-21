import { routeKeyForm, urlKeyForm } from './key-form.js'

/** @import { KeyedSegment } from './key-form.js' */

const organisationId = '6507f1f77bcf86cd79943901'
const registrationId = '6507f1f77bcf86cd79943902'
const accreditationId = '6507f1f77bcf86cd79943903'

/** @type {KeyedSegment[]} */
const accreditationSegments = [
  { index: 2, record: 'organisation' },
  { index: 4, record: 'registration' },
  { index: 6, record: 'accreditation' }
]

/**
 * @param {string[]} values
 * @returns {string[]}
 */
const pathOf = ([organisation, registration, accreditation]) =>
  `/organisations/${organisation}/registrations/${registration}/accreditations/${accreditation}/page`.split(
    '/'
  )

describe(routeKeyForm, () => {
  it('reads a route addressed by ids', () => {
    expect(
      routeKeyForm(
        '/organisations/{organisationId}/registrations/{registrationId}/accreditations/{accreditationId}/waste-balance-events'
      )
    ).toStrictEqual({ form: 'ids', segments: accreditationSegments })
  })

  it('reads a route addressed by natural keys', () => {
    expect(
      routeKeyForm(
        '/organisations/{organisationNumber}/registrations/{registrationNumber}/accreditations/{year}/reports/{cadence}/{period}/submissions/{submissionNumber}'
      )
    ).toStrictEqual({ form: 'naturalKeys', segments: accreditationSegments })
  })

  it('reads a route that names only the organisation', () => {
    expect(
      routeKeyForm('/organisations/{organisationId}/overview')
    ).toStrictEqual({
      form: 'ids',
      segments: [{ index: 2, record: 'organisation' }]
    })
  })

  it('does not count a report year as the accreditation', () => {
    expect(
      routeKeyForm(
        '/organisations/{organisationNumber}/registrations/{registrationNumber}/reports/{year}/{cadence}'
      )
    ).toStrictEqual({
      form: 'naturalKeys',
      segments: [
        { index: 2, record: 'organisation' },
        { index: 4, record: 'registration' }
      ]
    })
  })

  it.each([
    '/organisations/{id}',
    '/system-logs/download/{organisationId}/{registrationId}/{summaryLogId}'
  ])('ignores %s, which names no record by its keys', (routePath) => {
    expect(routeKeyForm(routePath)).toBeNull()
  })

  it('ignores a route that mixes ids and natural keys', () => {
    expect(
      routeKeyForm(
        '/organisations/{organisationNumber}/registrations/{registrationId}'
      )
    ).toBeNull()
  })
})

describe(urlKeyForm, () => {
  it('reads ids', () => {
    expect(
      urlKeyForm(
        pathOf([organisationId, registrationId, accreditationId]),
        accreditationSegments
      )
    ).toBe('ids')
  })

  it('reads natural keys', () => {
    expect(
      urlKeyForm(
        pathOf(['500123', 'R26ER5001180041PL', '2026']),
        accreditationSegments
      )
    ).toBe('naturalKeys')
  })

  it('reads neither form from a mix of the two', () => {
    expect(
      urlKeyForm(
        pathOf(['500123', registrationId, '2026']),
        accreditationSegments
      )
    ).toBeNull()
  })

  it('reads natural keys that follow no particular format', () => {
    expect(
      urlKeyForm(
        pathOf(['500123', 'REG-50030-001', '2026']),
        accreditationSegments
      )
    ).toBe('naturalKeys')
  })
})
