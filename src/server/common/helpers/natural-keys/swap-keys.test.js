import { toIds, toNaturalKeys } from './swap-keys.js'

/** @import { OrganisationOverview } from '#server/common/helpers/fetch-organisation-overview.js' */

const accreditation = {
  id: 'acc-1',
  accreditationNumber: 'A26ER5001180114PL',
  status: 'approved',
  year: 2026
}

/**
 * @param {Partial<OrganisationOverview['registrations'][number]>[]} registrations
 * @returns {OrganisationOverview}
 */
const overviewWith = (registrations) =>
  /** @type {OrganisationOverview} */ ({
    id: 'org-1',
    organisationNumber: '500123',
    companyName: 'ACME ltd',
    registrations
  })

const overview = overviewWith([
  { id: 'reg-1', registrationNumber: 'R26ER5001180041PL', accreditation },
  { id: 'reg-2', registrationNumber: undefined }
])

describe(toNaturalKeys, () => {
  it('names the organisation by its number', () => {
    expect(toNaturalKeys(overview, { organisationId: 'org-1' })).toStrictEqual({
      organisationNumber: '500123'
    })
  })

  it('names the registration by its number', () => {
    expect(
      toNaturalKeys(overview, {
        organisationId: 'org-1',
        registrationId: 'reg-1'
      })
    ).toStrictEqual({
      organisationNumber: '500123',
      registrationNumber: 'R26ER5001180041PL'
    })
  })

  it('names the accreditation by its year', () => {
    expect(
      toNaturalKeys(overview, {
        organisationId: 'org-1',
        registrationId: 'reg-1',
        accreditationId: 'acc-1'
      })
    ).toStrictEqual({
      organisationNumber: '500123',
      registrationNumber: 'R26ER5001180041PL',
      year: '2026'
    })
  })

  it.each([
    ['a registration it does not hold', 'reg-9'],
    ['a registration with no number', 'reg-2']
  ])('finds nothing for %s', (_, registrationId) => {
    expect(
      toNaturalKeys(overview, { organisationId: 'org-1', registrationId })
    ).toBeNull()
  })

  it('finds nothing for a number two registrations share', () => {
    const shared = overviewWith([
      { id: 'reg-1', registrationNumber: 'R26ER5001180041PL' },
      { id: 'reg-2', registrationNumber: 'R26ER5001180041PL' }
    ])

    expect(
      toNaturalKeys(shared, {
        organisationId: 'org-1',
        registrationId: 'reg-1'
      })
    ).toBeNull()
  })

  it.each([
    ['another accreditation', 'acc-9', accreditation],
    [
      'an accreditation with no number',
      'acc-1',
      { ...accreditation, accreditationNumber: null }
    ],
    ['an accreditation with no year', 'acc-1', { ...accreditation, year: null }]
  ])('finds nothing for %s', (_, accreditationId, held) => {
    const holding = overviewWith([
      {
        id: 'reg-1',
        registrationNumber: 'R26ER5001180041PL',
        accreditation: held
      }
    ])

    expect(
      toNaturalKeys(holding, {
        organisationId: 'org-1',
        registrationId: 'reg-1',
        accreditationId
      })
    ).toBeNull()
  })
})

describe(toIds, () => {
  it('names the organisation by its id', () => {
    expect(toIds(overview, { organisationNumber: '500123' })).toStrictEqual({
      organisationId: 'org-1'
    })
  })

  it('names the registration by its id', () => {
    expect(
      toIds(overview, {
        organisationNumber: '500123',
        registrationNumber: 'R26ER5001180041PL'
      })
    ).toStrictEqual({ organisationId: 'org-1', registrationId: 'reg-1' })
  })

  it('names the accreditation for the year by its id', () => {
    expect(
      toIds(overview, {
        organisationNumber: '500123',
        registrationNumber: 'R26ER5001180041PL',
        year: '2026'
      })
    ).toStrictEqual({
      organisationId: 'org-1',
      registrationId: 'reg-1',
      accreditationId: 'acc-1'
    })
  })

  it('finds nothing for a number it does not hold', () => {
    expect(
      toIds(overview, {
        organisationNumber: '500123',
        registrationNumber: 'R26ER9999999999PL'
      })
    ).toBeNull()
  })

  it.each([
    ['a year the accreditation is not for', overview, '2027'],
    [
      'a registration with no accreditation',
      overviewWith([{ id: 'reg-1', registrationNumber: 'R26ER5001180041PL' }]),
      '2026'
    ]
  ])('finds nothing for %s', (_, holding, year) => {
    expect(
      toIds(holding, {
        organisationNumber: '500123',
        registrationNumber: 'R26ER5001180041PL',
        year
      })
    ).toBeNull()
  })
})
