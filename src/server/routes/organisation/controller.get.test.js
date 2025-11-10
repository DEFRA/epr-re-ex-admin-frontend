import { vi } from 'vitest'
import { organisationsGETController } from './controller.get.js'

vi.mock('#server/common/helpers/fetch-json-from-backend.js', () => ({
  fetchJsonFromBackend: vi.fn()
}))

vi.mock(
  '#server/routes/organisations/controller.js',
  async (importOriginal) => {
    const actual = await importOriginal()
    return {
      ...actual,
      organisationsBreadcrumb: {
        text: 'Organisations',
        href: '/organisations'
      }
    }
  }
)

describe('organisation GET controller - Unit Tests - Flash message handling', () => {
  let mockRequest
  let mockH
  let fetchJsonFromBackend

  beforeEach(async () => {
    // Import the mocked function
    const module = await import(
      '#server/common/helpers/fetch-json-from-backend.js'
    )
    fetchJsonFromBackend = module.fetchJsonFromBackend
    vi.clearAllMocks()

    mockRequest = {
      params: { id: 'test-org-id' },
      yar: {
        get: vi.fn().mockResolvedValue(null),
        clear: vi.fn().mockResolvedValue(undefined)
      }
    }

    mockH = {
      view: vi.fn().mockReturnValue('rendered-view')
    }
  })

  test('Should handle successful GET with no flash messages', async () => {
    const mockOrgData = {
      id: 'test-org-id',
      companyDetails: { name: 'Test Org' }
    }

    fetchJsonFromBackend.mockResolvedValue(mockOrgData)

    await organisationsGETController.handler(mockRequest, mockH)

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      mockRequest,
      '/v1/organisations/test-org-id',
      {}
    )

    expect(mockRequest.yar.get).toHaveBeenCalledWith('organisationErrors')
    expect(mockRequest.yar.get).toHaveBeenCalledWith('organisationSuccess')
    expect(mockRequest.yar.clear).toHaveBeenCalledWith('organisationErrors')
    expect(mockRequest.yar.clear).toHaveBeenCalledWith('organisationSuccess')

    expect(mockH.view).toHaveBeenCalledWith('routes/organisation/index', {
      pageTitle: 'Organisation',
      heading: 'Organisation',
      organisationJson: JSON.stringify(mockOrgData),
      breadcrumbs: [{ text: 'Organisations', href: '/organisations' }]
    })
  })

  test('Should include error messages from session', async () => {
    const mockOrgData = {
      id: 'test-org-id',
      companyDetails: { name: 'Test Org' }
    }

    const mockErrors = {
      errorTitle: 'Validation Error',
      errors: [{ text: 'Field is required' }]
    }

    fetchJsonFromBackend.mockResolvedValue(mockOrgData)
    mockRequest.yar.get.mockImplementation((key) => {
      if (key === 'organisationErrors') return Promise.resolve(mockErrors)
      return Promise.resolve(null)
    })

    await organisationsGETController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith(
      'routes/organisation/index',
      expect.objectContaining({
        errorTitle: 'Validation Error',
        errors: [{ text: 'Field is required' }]
      })
    )
  })

  test('Should include success message from session', async () => {
    const mockOrgData = {
      id: 'test-org-id',
      companyDetails: { name: 'Test Org' }
    }

    fetchJsonFromBackend.mockResolvedValue(mockOrgData)
    mockRequest.yar.get.mockImplementation((key) => {
      if (key === 'organisationSuccess') return Promise.resolve(true)
      return Promise.resolve(null)
    })

    await organisationsGETController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith(
      'routes/organisation/index',
      expect.objectContaining({
        message: 'success'
      })
    )
  })

  test('Should include both error and success messages if both exist', async () => {
    const mockOrgData = {
      id: 'test-org-id',
      companyDetails: { name: 'Test Org' }
    }

    const mockErrors = {
      errorTitle: 'Test Error',
      errors: [{ text: 'Error message' }]
    }

    fetchJsonFromBackend.mockResolvedValue(mockOrgData)
    mockRequest.yar.get.mockImplementation((key) => {
      if (key === 'organisationErrors') return Promise.resolve(mockErrors)
      if (key === 'organisationSuccess') return Promise.resolve(true)
      return Promise.resolve(null)
    })

    await organisationsGETController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith(
      'routes/organisation/index',
      expect.objectContaining({
        errorTitle: 'Test Error',
        errors: [{ text: 'Error message' }],
        message: 'success'
      })
    )
  })
})
