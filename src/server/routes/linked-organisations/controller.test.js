import { vi } from 'vitest'
import { linkedOrganisationsController } from './controller.js'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

vi.mock('#server/common/helpers/fetch-json-from-backend.js', () => ({
  fetchJsonFromBackend: vi.fn()
}))

const mockLinkedOrg = {
  id: 'org-1',
  orgId: 101,
  companyDetails: { name: 'Acme Ltd', registrationNumber: '12345678' },
  status: 'active',
  linkedDefraOrganisation: {
    orgId: 'defra-uuid-1',
    orgName: 'Defra Org One',
    linkedAt: '2025-06-15T10:30:00.000Z',
    linkedBy: { email: 'admin@defra.gov.uk', id: 'user-uuid-1' }
  }
}

describe('linked-organisations controller', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      route: {
        settings: {
          app: { pageTitle: 'Linked organisations' }
        }
      },
      query: {},
      yar: {
        get: vi.fn().mockReturnValue(null),
        clear: vi.fn()
      }
    }

    mockH = {
      view: vi.fn().mockReturnValue('rendered-view')
    }
  })

  test('Should fetch all linked organisations on GET', async () => {
    fetchJsonFromBackend.mockResolvedValue([mockLinkedOrg])

    await linkedOrganisationsController.handler(mockRequest, mockH)

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      mockRequest,
      '/v1/linked-organisations'
    )

    expect(mockH.view).toHaveBeenCalledWith(
      'routes/linked-organisations/index',
      expect.objectContaining({
        searchTerm: '',
        linkedOrganisations: [
          {
            eprOrgName: 'Acme Ltd',
            eprOrgId: 101,
            registrationNumber: '12345678',
            defraOrgName: 'Defra Org One',
            defraOrgId: 'defra-uuid-1',
            linkedAt: '2025-06-15T10:30:00.000Z',
            linkedByEmail: 'admin@defra.gov.uk'
          }
        ]
      })
    )
  })

  test('Should pass search term as query param to backend', async () => {
    mockRequest.query = { search: ' acme ' }
    fetchJsonFromBackend.mockResolvedValue([mockLinkedOrg])

    await linkedOrganisationsController.handler(mockRequest, mockH)

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      mockRequest,
      '/v1/linked-organisations?name=acme'
    )

    expect(mockH.view).toHaveBeenCalledWith(
      'routes/linked-organisations/index',
      expect.objectContaining({
        searchTerm: 'acme'
      })
    )
  })

  test('Should fetch all when search term is empty', async () => {
    mockRequest.query = { search: '  ' }
    fetchJsonFromBackend.mockResolvedValue([])

    await linkedOrganisationsController.handler(mockRequest, mockH)

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      mockRequest,
      '/v1/linked-organisations'
    )
  })

  test('Should handle backend returning non-array', async () => {
    fetchJsonFromBackend.mockResolvedValue({})

    await linkedOrganisationsController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith(
      'routes/linked-organisations/index',
      expect.objectContaining({
        linkedOrganisations: []
      })
    )
  })

  test('Should display error message from session and clear it', async () => {
    mockRequest.yar.get.mockReturnValue('Download failed')
    fetchJsonFromBackend.mockResolvedValue([])

    await linkedOrganisationsController.handler(mockRequest, mockH)

    expect(mockRequest.yar.get).toHaveBeenCalledWith('error')
    expect(mockRequest.yar.clear).toHaveBeenCalledWith('error')

    expect(mockH.view).toHaveBeenCalledWith(
      'routes/linked-organisations/index',
      expect.objectContaining({
        error: 'Download failed'
      })
    )
  })

  test('Should pass pageTitle from route settings', async () => {
    fetchJsonFromBackend.mockResolvedValue([])

    await linkedOrganisationsController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith(
      'routes/linked-organisations/index',
      expect.objectContaining({
        pageTitle: 'Linked organisations'
      })
    )
  })

  test('Should encode special characters in search term', async () => {
    mockRequest.query = { search: 'Acme & Co' }
    fetchJsonFromBackend.mockResolvedValue([])

    await linkedOrganisationsController.handler(mockRequest, mockH)

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      mockRequest,
      '/v1/linked-organisations?name=Acme%20%26%20Co'
    )
  })
})
