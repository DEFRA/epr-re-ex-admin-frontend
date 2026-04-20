import { vi } from 'vitest'
import { fetchOrganisationOverview } from './fetch-organisation-overview.js'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

vi.mock('#server/common/helpers/fetch-json-from-backend.js', () => ({
  fetchJsonFromBackend: vi.fn()
}))

const mockRequest = {}

const mockOverview = {
  id: '69c3b4f0abda9efa68dd6697',
  companyName: 'ACME ltd',
  registrations: []
}

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

    const result = await fetchOrganisationOverview(mockRequest, '69c3b4f0abda9efa68dd6697')

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
