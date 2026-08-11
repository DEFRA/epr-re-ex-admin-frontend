import { vi } from 'vitest'
import {
  fetchOrganisationOverview,
  findRegistration,
  findUnlinkedAccreditation
} from './fetch-organisation-overview.js'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

/** @import { Request } from '@hapi/hapi' */
/** @import { Accreditation, OrganisationOverview, Registration } from './fetch-organisation-overview.js' */

vi.mock('#server/common/helpers/fetch-json-from-backend.js', () => ({
  fetchJsonFromBackend: vi.fn()
}))

const mockRequest = /** @type {Request} */ ({})

const mockOverview = {
  id: '69c3b4f0abda9efa68dd6697',
  companyName: 'ACME ltd',
  registrations: []
}

const mockFetchJsonFromBackend = vi.mocked(fetchJsonFromBackend)

describe('fetchOrganisationOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('calls fetchJsonFromBackend with the correct overview URL', async () => {
    mockFetchJsonFromBackend.mockResolvedValue(mockOverview)

    await fetchOrganisationOverview(mockRequest, '69c3b4f0abda9efa68dd6697')

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      mockRequest,
      '/v1/organisations/69c3b4f0abda9efa68dd6697/overview',
      {}
    )
  })

  test('returns the overview response from the backend', async () => {
    mockFetchJsonFromBackend.mockResolvedValue(mockOverview)

    const result = await fetchOrganisationOverview(
      mockRequest,
      '69c3b4f0abda9efa68dd6697'
    )

    expect(result).toBe(mockOverview)
  })

  test('propagates errors thrown by fetchJsonFromBackend', async () => {
    const error = new Error('backend unavailable')
    mockFetchJsonFromBackend.mockRejectedValue(error)

    await expect(
      fetchOrganisationOverview(mockRequest, '69c3b4f0abda9efa68dd6697')
    ).rejects.toThrow('backend unavailable')
  })
})

describe(findRegistration, () => {
  const organisationId = 'aaa111bbb222ccc333ddd4444'
  const registrationId = 'bbb222ccc333ddd444eee5555'

  test('returns the matching registration when present', () => {
    const registration = { id: registrationId, registrationNumber: 'REG-001' }
    const overview = /** @type {OrganisationOverview} */ ({
      registrations: [registration]
    })

    expect(findRegistration(overview, organisationId, registrationId)).toBe(
      registration
    )
  })

  test('throws notFound enriched with code and event when missing', () => {
    const overview = /** @type {OrganisationOverview} */ ({
      registrations: /** @type {Registration[]} */ ([])
    })

    expect(() =>
      findRegistration(overview, organisationId, registrationId)
    ).toThrow(
      expect.objectContaining({
        isBoom: true,
        message: 'Registration not found',
        code: 'registration_not_found',
        event: {
          action: 'fetch_registration',
          reason: `organisationId=${organisationId} registrationId=${registrationId}`
        }
      })
    )
  })
})

describe(findUnlinkedAccreditation, () => {
  const organisationId = 'aaa111bbb222ccc333ddd4444'
  const accreditationId = 'ccc333ddd444eee555fff6666'

  const expectedNotFound = expect.objectContaining({
    isBoom: true,
    message: 'Unlinked accreditation not found',
    code: 'accreditation_not_found',
    event: {
      action: 'fetch_unlinked_accreditation',
      reason: `organisationId=${organisationId} accreditationId=${accreditationId}`
    }
  })

  /**
   * @param {Accreditation[]} [unlinkedAccreditations]
   * @returns {OrganisationOverview}
   */
  const overviewWith = (unlinkedAccreditations) => ({
    id: organisationId,
    companyName: 'ACME ltd',
    registrations: [],
    unlinkedAccreditations
  })

  test('returns the matching unlinked accreditation when present', () => {
    const accreditation = /** @type {Accreditation} */ ({
      id: accreditationId,
      accreditationNumber: null,
      status: 'created'
    })

    expect(
      findUnlinkedAccreditation(
        overviewWith([accreditation]),
        organisationId,
        accreditationId
      )
    ).toBe(accreditation)
  })

  test('throws notFound when the accreditation is not in the collection', () => {
    expect(() =>
      findUnlinkedAccreditation(
        overviewWith([]),
        organisationId,
        accreditationId
      )
    ).toThrow(expectedNotFound)
  })

  test('throws notFound when the overview has no unlinked accreditations at all', () => {
    expect(() =>
      findUnlinkedAccreditation(overviewWith(), organisationId, accreditationId)
    ).toThrow(expectedNotFound)
  })
})
