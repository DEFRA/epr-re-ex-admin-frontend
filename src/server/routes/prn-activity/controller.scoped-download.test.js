import { vi, describe, test, expect, beforeEach } from 'vitest'
import Boom from '@hapi/boom'

import { prnActivityScopedDownloadController } from './controller.scoped-download.js'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

vi.mock('#server/common/helpers/fetch-json-from-backend.js', () => ({
  fetchJsonFromBackend: vi.fn()
}))

const mockPrn = {
  prnNumber: 'PRN-001',
  status: 'awaiting_acceptance',
  issuedToOrganisation: { name: 'Org A' },
  tonnage: 100,
  material: 'Glass',
  processToBeUsed: 'R3',
  isDecemberWaste: true,
  issuedAt: '2025-06-15T10:30:00.000Z',
  issuedBy: { name: 'John', position: 'Manager' },
  accreditationNumber: 'ACC-2025-001',
  accreditationYear: 2025,
  organisationName: 'Reprocessor Ltd',
  wasteProcessingType: 'reprocessor'
}

const mockFetchJsonFromBackend = vi.mocked(fetchJsonFromBackend)

describe('prn-activity scoped download controller', () => {
  let request
  let h
  let responseBuilder

  beforeEach(() => {
    vi.clearAllMocks()

    request = {
      params: {
        organisationId: 'org-1',
        registrationId: 'reg-1',
        accreditationId: 'acc-9'
      },
      yar: { set: vi.fn() }
    }

    responseBuilder = { header: vi.fn().mockReturnThis() }
    h = {
      response: vi.fn().mockReturnValue(responseBuilder),
      redirect: vi.fn().mockReturnValue('redirect-response')
    }
  })

  test('Should fetch the PRNs of the accreditation by its full path', async () => {
    mockFetchJsonFromBackend.mockResolvedValue({
      items: [],
      hasMore: false
    })

    await prnActivityScopedDownloadController.handler(request, h)

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      request,
      expect.stringContaining(
        '/v1/admin/organisations/org-1/registrations/reg-1/accreditations/acc-9/packaging-recycling-notes'
      )
    )
  })

  test('Should generate a headers-only CSV when the backend returns no payload', async () => {
    mockFetchJsonFromBackend.mockResolvedValue(null)

    await prnActivityScopedDownloadController.handler(request, h)

    const csvContent = h.response.mock.calls[0][0]
    expect(csvContent).toContain('PRN Number')
    expect(csvContent).not.toContain('PRN-001')
  })

  test('Should generate CSV and set an accreditation-scoped filename', async () => {
    mockFetchJsonFromBackend.mockResolvedValue({
      items: [mockPrn],
      hasMore: false
    })

    await prnActivityScopedDownloadController.handler(request, h)

    const csvContent = h.response.mock.calls[0][0]
    expect(csvContent).toContain('PRN-001')
    expect(responseBuilder.header).toHaveBeenCalledWith(
      'Content-Type',
      'text/csv'
    )
    expect(responseBuilder.header).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="prn-activity-acc-9.csv"'
    )
  })

  test('Should redirect to the registration overview with a flash error on failure', async () => {
    mockFetchJsonFromBackend.mockRejectedValue(new Error('Network error'))

    const result = await prnActivityScopedDownloadController.handler(request, h)

    expect(request.yar.set).toHaveBeenCalledWith(
      'error',
      'There was a problem downloading the PRN activity data. Please try again.'
    )
    expect(h.redirect).toHaveBeenCalledWith(
      '/organisations/org-1/registrations/reg-1/overview'
    )
    expect(result).toBe('redirect-response')
  })

  test('Should use the backend error message when available', async () => {
    mockFetchJsonFromBackend.mockRejectedValue(
      Boom.badRequest('Custom backend error message')
    )

    await prnActivityScopedDownloadController.handler(request, h)

    expect(request.yar.set).toHaveBeenCalledWith(
      'error',
      'Custom backend error message'
    )
  })
})
