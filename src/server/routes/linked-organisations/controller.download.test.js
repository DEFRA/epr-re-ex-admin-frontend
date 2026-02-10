import { vi } from 'vitest'
import { linkedOrganisationsDownloadController } from './controller.download.js'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { mockLinkedOrg } from './test-fixtures.js'

vi.mock('#server/common/helpers/fetch-json-from-backend.js', () => ({
  fetchJsonFromBackend: vi.fn()
}))

describe('linked-organisations download controller', () => {
  let mockRequest
  let mockH
  let mockResponse

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      payload: {},
      yar: {
        set: vi.fn()
      }
    }

    mockResponse = {
      header: vi.fn().mockReturnThis()
    }

    mockH = {
      response: vi.fn().mockReturnValue(mockResponse),
      redirect: vi.fn().mockReturnValue('redirect-response')
    }
  })

  test('Should generate CSV with correct headers and data', async () => {
    fetchJsonFromBackend.mockResolvedValue([mockLinkedOrg])

    await linkedOrganisationsDownloadController.handler(mockRequest, mockH)

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      mockRequest,
      '/v1/linked-organisations'
    )

    const csvContent = mockH.response.mock.calls[0][0]
    const lines = csvContent.split('\n')
    expect(lines[0]).toBe(
      '"EPR Organisation Name","EPR Organisation ID","Registration Number","Defra ID Organisation Name","Defra ID Organisation ID","Date Linked","Linked By"'
    )
    expect(csvContent).toContain('Acme Ltd')
    expect(csvContent).toContain('101')
    expect(csvContent).toContain('Defra Org One')
    expect(csvContent).toContain('admin@defra.gov.uk')
  })

  test('Should set correct Content-Type and Content-Disposition headers', async () => {
    fetchJsonFromBackend.mockResolvedValue([mockLinkedOrg])

    await linkedOrganisationsDownloadController.handler(mockRequest, mockH)

    expect(mockResponse.header).toHaveBeenCalledWith('Content-Type', 'text/csv')
    expect(mockResponse.header).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="linked-organisations.csv"'
    )
  })

  test('Should handle empty linked organisations', async () => {
    fetchJsonFromBackend.mockResolvedValue([])

    await linkedOrganisationsDownloadController.handler(mockRequest, mockH)

    const csvContent = mockH.response.mock.calls[0][0]
    const lines = csvContent.split('\n')
    expect(lines).toHaveLength(1)
    expect(lines[0]).toContain('EPR Organisation Name')
  })

  test('Should handle backend returning non-array data', async () => {
    fetchJsonFromBackend.mockResolvedValue({})

    await linkedOrganisationsDownloadController.handler(mockRequest, mockH)

    const csvContent = mockH.response.mock.calls[0][0]
    const lines = csvContent.split('\n')
    expect(lines).toHaveLength(1)
    expect(lines[0]).toContain('EPR Organisation Name')
  })

  test('Should handle null field values in CSV', async () => {
    const orgWithNullField = {
      ...mockLinkedOrg,
      orgId: null
    }
    fetchJsonFromBackend.mockResolvedValue([orgWithNullField])

    await linkedOrganisationsDownloadController.handler(mockRequest, mockH)

    const csvContent = mockH.response.mock.calls[0][0]
    expect(csvContent).toContain('Acme Ltd')
  })

  test('Should escape CSV fields containing commas', async () => {
    const orgWithComma = {
      ...mockLinkedOrg,
      companyDetails: { name: 'Acme, Ltd', registrationNumber: '12345678' }
    }
    fetchJsonFromBackend.mockResolvedValue([orgWithComma])

    await linkedOrganisationsDownloadController.handler(mockRequest, mockH)

    const csvContent = mockH.response.mock.calls[0][0]
    expect(csvContent).toContain('"Acme, Ltd"')
  })

  test('Should escape CSV fields containing double quotes', async () => {
    const orgWithQuote = {
      ...mockLinkedOrg,
      companyDetails: {
        name: 'Acme "Best" Ltd',
        registrationNumber: '12345678'
      }
    }
    fetchJsonFromBackend.mockResolvedValue([orgWithQuote])

    await linkedOrganisationsDownloadController.handler(mockRequest, mockH)

    const csvContent = mockH.response.mock.calls[0][0]
    expect(csvContent).toContain('"Acme ""Best"" Ltd"')
  })

  test('Should prefix fields starting with formula-injection characters', async () => {
    const orgWithFormulaValue = {
      ...mockLinkedOrg,
      companyDetails: { name: '=SUM(A1)', registrationNumber: '12345678' }
    }
    fetchJsonFromBackend.mockResolvedValue([orgWithFormulaValue])

    await linkedOrganisationsDownloadController.handler(mockRequest, mockH)

    const csvContent = mockH.response.mock.calls[0][0]
    expect(csvContent).toContain('"\'=SUM(A1)"')
  })

  test('Should redirect with error message on fetch failure', async () => {
    fetchJsonFromBackend.mockRejectedValue(new Error('Network error'))

    const result = await linkedOrganisationsDownloadController.handler(
      mockRequest,
      mockH
    )

    expect(mockRequest.yar.set).toHaveBeenCalledWith(
      'error',
      'There was a problem downloading the linked organisations data. Please try again.'
    )
    expect(mockH.redirect).toHaveBeenCalledWith('/linked-organisations')
    expect(result).toBe('redirect-response')
  })

  test('Should use error message from backend when available', async () => {
    const error = new Error('Backend error')
    error.output = { payload: { message: 'Custom backend error message' } }
    fetchJsonFromBackend.mockRejectedValue(error)

    await linkedOrganisationsDownloadController.handler(mockRequest, mockH)

    expect(mockRequest.yar.set).toHaveBeenCalledWith(
      'error',
      'Custom backend error message'
    )
  })

  test('Should format linked date in CSV', async () => {
    fetchJsonFromBackend.mockResolvedValue([mockLinkedOrg])

    await linkedOrganisationsDownloadController.handler(mockRequest, mockH)

    const csvContent = mockH.response.mock.calls[0][0]
    expect(csvContent).toContain('15 June 2025 at')
  })

  test('Should pass search term as query param to backend', async () => {
    mockRequest.payload = { search: ' acme ' }
    fetchJsonFromBackend.mockResolvedValue([mockLinkedOrg])

    await linkedOrganisationsDownloadController.handler(mockRequest, mockH)

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      mockRequest,
      '/v1/linked-organisations?name=acme'
    )
  })

  test('Should fetch all when no search term in payload', async () => {
    mockRequest.payload = {}
    fetchJsonFromBackend.mockResolvedValue([mockLinkedOrg])

    await linkedOrganisationsDownloadController.handler(mockRequest, mockH)

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      mockRequest,
      '/v1/linked-organisations'
    )
  })
})
