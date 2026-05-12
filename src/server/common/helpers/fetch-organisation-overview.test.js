import { vi } from 'vitest'
import {
  fetchOrganisationOverview,
  findRegistration
} from './fetch-organisation-overview.js'
import * as fetchJsonFromBackendMod from '#server/common/helpers/fetch-json-from-backend.js'

/**
 * @import { Request } from '@hapi/hapi'
 * @import { OrganisationOverview, Registration } from './fetch-organisation-overview.js'
 */

vi.mock('#server/common/helpers/fetch-json-from-backend.js')

const { fetchJsonFromBackend } = vi.mocked(fetchJsonFromBackendMod)

const mockRequest = /** @type {Request} */ (/** @type {unknown} */ ({}))

const mockOverview = /** @type {OrganisationOverview} */ ({
  id: '69c3b4f0abda9efa68dd6697',
  companyName: 'ACME ltd',
  registrations: []
})

describe('fetchOrganisationOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('calls fetchJsonFromBackend with the correct overview URL', async () => {
    fetchJsonFromBackend.mockResolvedValue(mockOverview)

    await fetchOrganisationOverview(mockRequest, '69c3b4f0abda9efa68dd6697')

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      mockRequest,
      '/v1/organisations/69c3b4f0abda9efa68dd6697/overview',
      {}
    )
  })

  test('returns the overview response from the backend', async () => {
    fetchJsonFromBackend.mockResolvedValue(mockOverview)

    const result = await fetchOrganisationOverview(
      mockRequest,
      '69c3b4f0abda9efa68dd6697'
    )

    expect(result).toBe(mockOverview)
  })

  test('propagates errors thrown by fetchJsonFromBackend', async () => {
    const error = new Error('backend unavailable')
    fetchJsonFromBackend.mockRejectedValue(error)

    await expect(
      fetchOrganisationOverview(mockRequest, '69c3b4f0abda9efa68dd6697')
    ).rejects.toThrow('backend unavailable')
  })
})

describe(findRegistration, () => {
  const organisationId = 'aaa111bbb222ccc333ddd4444'
  const registrationId = 'bbb222ccc333ddd444eee5555'

  test('returns the matching registration when present', () => {
    const registration = /** @type {Registration} */ ({
      id: registrationId,
      registrationNumber: 'REG-001'
    })
    const overview = /** @type {OrganisationOverview} */ ({
      registrations: [registration]
    })

    expect(findRegistration(overview, organisationId, registrationId)).toBe(
      registration
    )
  })

  test('throws notFound enriched with code and event when missing', () => {
    const overview = /** @type {OrganisationOverview} */ (
      /** @type {unknown} */ ({
        registrations: []
      })
    )

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
