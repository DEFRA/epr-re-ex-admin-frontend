import { vi } from 'vitest'
import { organisationsGETController } from './controller.get.js'

vi.mock('#server/common/helpers/fetch-json-from-backend.js', () => ({
  fetchJsonFromBackend: vi.fn()
}))

vi.mock('#server/routes/organisations/controller.js', async (importOriginal) =>
  importOriginal()
)

describe('organisation GET controller - Unit Tests - Flash message handling', () => {
  let mockRequest
  let mockH
  let fetchJsonFromBackend

  beforeEach(async () => {
    // Import the mocked function
    const module =
      await import('#server/common/helpers/fetch-json-from-backend.js')
    fetchJsonFromBackend = module.fetchJsonFromBackend
    vi.clearAllMocks()

    mockRequest = {
      params: { id: 'test-org-id' },
      yar: {
        get: vi.fn().mockReturnValue(null),
        clear: vi.fn().mockResolvedValue(undefined)
      },
      route: {
        settings: {
          app: { pageTitle: 'Organisation Details' }
        }
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

    expect(mockRequest.yar.get).toHaveBeenCalledWith('errors')
    expect(mockRequest.yar.get).toHaveBeenCalledWith('success')
    expect(mockRequest.yar.clear).toHaveBeenCalledWith('errors')
    expect(mockRequest.yar.clear).toHaveBeenCalledWith('success')

    expect(mockH.view).toHaveBeenCalledWith('routes/organisation/index', {
      pageTitle: 'Organisation Details',
      heading: 'Test Org',
      organisationJson: JSON.stringify(mockOrgData)
    })
  })

  test('Should include single error as errorList from session', async () => {
    const mockOrgData = {
      id: 'test-org-id',
      companyDetails: { name: 'Test Org' }
    }

    fetchJsonFromBackend.mockResolvedValue(mockOrgData)
    mockRequest.yar.get.mockImplementation((key) => {
      if (key === 'errors') {
        return [{ message: 'Validation Error: Field is required' }]
      }
      return null
    })

    await organisationsGETController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith(
      'routes/organisation/index',
      expect.objectContaining({
        errorList: [{ text: 'Validation Error: Field is required' }]
      })
    )
  })

  test('Should include structured validation errors as errorList from session', async () => {
    const mockOrgData = {
      id: 'test-org-id',
      companyDetails: { name: 'Test Org' }
    }

    const mockValidationErrors = [
      {
        path: 'registrations.0.registrationNumber',
        message: '"registrationNumber" is required when status is approved'
      },
      {
        path: 'registrations.0.validFrom',
        message: '"validFrom" is required when status is approved or suspended'
      }
    ]

    fetchJsonFromBackend.mockResolvedValue(mockOrgData)
    mockRequest.yar.get.mockImplementation((key) => {
      if (key === 'errors') return mockValidationErrors
      return null
    })

    await organisationsGETController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith(
      'routes/organisation/index',
      expect.objectContaining({
        errorList: [
          {
            text: '"registrationNumber" is required when status is approved'
          },
          {
            text: '"validFrom" is required when status is approved or suspended'
          }
        ]
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
      if (key === 'success') return true
      return null
    })

    await organisationsGETController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith(
      'routes/organisation/index',
      expect.objectContaining({
        message: 'success'
      })
    )
  })

  test('Should include both errorList and success message if both exist', async () => {
    const mockOrgData = {
      id: 'test-org-id',
      companyDetails: { name: 'Test Org' }
    }

    fetchJsonFromBackend.mockResolvedValue(mockOrgData)
    mockRequest.yar.get.mockImplementation((key) => {
      if (key === 'errors') return [{ message: 'Test Error' }]
      if (key === 'success') return true
      return null
    })

    await organisationsGETController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith(
      'routes/organisation/index',
      expect.objectContaining({
        errorList: [{ text: 'Test Error' }],
        message: 'success'
      })
    )
  })
})
