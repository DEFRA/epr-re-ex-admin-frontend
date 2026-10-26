import { toNaturalKeys } from './swap-keys.js'

/** @import { StoredAccreditation, StoredOrganisation, StoredRegistration } from './find-organisation.js' */

/** @type {StoredAccreditation} */
const accreditation = {
  id: 'acc-1',
  accreditationNumber: 'A26ER5001180114PL',
  validFrom: '2026-03-01'
}

/**
 * @param {StoredRegistration[]} registrations
 * @param {StoredAccreditation[]} [accreditations]
 * @returns {StoredOrganisation}
 */
const organisationWith = (registrations, accreditations = [accreditation]) => ({
  orgId: 500123,
  registrations,
  accreditations
})

const organisation = organisationWith([
  {
    id: 'reg-1',
    registrationNumber: 'R26ER5001180041PL',
    accreditationId: 'acc-1'
  },
  { id: 'reg-2' }
])

describe(toNaturalKeys, () => {
  it('names the organisation by its number', () => {
    expect(
      toNaturalKeys(organisation, { organisationId: 'org-1' })
    ).toStrictEqual({ organisationNumber: '500123' })
  })

  it('names the registration by its number', () => {
    expect(
      toNaturalKeys(organisation, {
        organisationId: 'org-1',
        registrationId: 'reg-1'
      })
    ).toStrictEqual({
      organisationNumber: '500123',
      registrationNumber: 'R26ER5001180041PL'
    })
  })

  it('names the accreditation by the year it is valid from', () => {
    expect(
      toNaturalKeys(organisation, {
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
      toNaturalKeys(organisation, { organisationId: 'org-1', registrationId })
    ).toBeNull()
  })

  it('finds nothing for a number two registrations share', () => {
    const shared = organisationWith([
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

  it('finds nothing for an accreditation the registration does not link to', () => {
    const holding = organisationWith(organisation.registrations, [
      accreditation,
      { ...accreditation, id: 'acc-9' }
    ])

    expect(
      toNaturalKeys(holding, {
        organisationId: 'org-1',
        registrationId: 'reg-1',
        accreditationId: 'acc-9'
      })
    ).toBeNull()
  })

  it.each([
    ['the organisation does not hold', []],
    ['has no number', [{ id: 'acc-1', validFrom: '2026-03-01' }]],
    [
      'has no validFrom',
      [{ id: 'acc-1', accreditationNumber: 'A26ER5001180114PL' }]
    ]
  ])(
    'finds nothing for a linked accreditation that %s',
    (_, accreditations) => {
      const holding = organisationWith(
        organisation.registrations,
        accreditations
      )

      expect(
        toNaturalKeys(holding, {
          organisationId: 'org-1',
          registrationId: 'reg-1',
          accreditationId: 'acc-1'
        })
      ).toBeNull()
    }
  )
})
