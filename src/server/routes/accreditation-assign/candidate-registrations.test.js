import { candidateRegistrations } from './candidate-registrations.js'

/** @import { Accreditation, Registration } from '#server/common/helpers/fetch-organisation-overview.js' */

const accreditation = /** @type {Accreditation} */ ({
  id: 'acc-1',
  accreditationNumber: null,
  status: 'created',
  material: 'glass',
  processingType: 'reprocessor',
  site: 'Site A'
})

/**
 * @param {Partial<Registration>} overrides
 * @returns {Registration}
 */
const registration = (overrides) =>
  /** @type {Registration} */ ({
    id: 'reg-1',
    registrationNumber: 'REG-001',
    status: 'approved',
    material: 'glass',
    processingType: 'reprocessor',
    site: 'Site A',
    reprocessingType: 'input',
    ...overrides
  })

describe(candidateRegistrations, () => {
  test('offers an approved, matching, unaccredited registration', () => {
    const match = registration({})

    expect(candidateRegistrations([match], accreditation)).toEqual([match])
  })

  test('excludes a registration that is not approved', () => {
    const pending = registration({ status: 'created' })

    expect(candidateRegistrations([pending], accreditation)).toEqual([])
  })

  test('excludes a registration that already has an accreditation', () => {
    const linked = registration({
      accreditation: /** @type {Accreditation} */ ({
        id: 'acc-2',
        accreditationNumber: 'ACC-002',
        status: 'approved'
      })
    })

    expect(candidateRegistrations([linked], accreditation)).toEqual([])
  })

  test('excludes a registration with no reprocessing type', () => {
    const noReprocessingType = registration({ reprocessingType: null })

    expect(candidateRegistrations([noReprocessingType], accreditation)).toEqual(
      []
    )
  })

  test('excludes a registration for a different material', () => {
    const otherMaterial = registration({ material: 'plastic' })

    expect(candidateRegistrations([otherMaterial], accreditation)).toEqual([])
  })

  test('excludes a registration with a different processing type', () => {
    const otherProcessingType = registration({ processingType: 'exporter' })

    expect(
      candidateRegistrations([otherProcessingType], accreditation)
    ).toEqual([])
  })

  test('excludes a registration at a different site', () => {
    const otherSite = registration({ site: 'Site B' })

    expect(candidateRegistrations([otherSite], accreditation)).toEqual([])
  })

  test('matches an exporter accreditation that has no site against a registration with no site', () => {
    const exporterAccreditation = /** @type {Accreditation} */ ({
      id: 'acc-3',
      accreditationNumber: null,
      status: 'created',
      material: 'glass',
      processingType: 'exporter'
    })
    const exporterRegistration = registration({
      processingType: 'exporter',
      site: undefined
    })

    expect(
      candidateRegistrations([exporterRegistration], exporterAccreditation)
    ).toEqual([exporterRegistration])
  })
})
