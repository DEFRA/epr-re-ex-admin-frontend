import { vi } from 'vitest'
import { linkedOrganisationsPostController } from './controller.post.js'
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

describe('linked-organisations POST controller', () => {
  let mockRequest
  let mockH
  let mockResponse

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
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

    await linkedOrganisationsPostController.handler(mockRequest, mockH)

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      mockRequest,
      '/v1/linked-organisations'
    )

    const csvContent = mockH.response.mock.calls[0][0]
    expect(csvContent).toContain('Linked organisations report')
    expect(csvContent).toContain(
      'EPR Organisation Name,EPR Organisation ID,Registration Number,Defra ID Organisation Name,Defra ID Organisation ID,Date Linked,Linked By'
    )
    expect(csvContent).toContain('Acme Ltd')
    expect(csvContent).toContain('101')
    expect(csvContent).toContain('Defra Org One')
    expect(csvContent).toContain('admin@defra.gov.uk')
  })

  test('Should set correct Content-Type and Content-Disposition headers', async () => {
    fetchJsonFromBackend.mockResolvedValue([mockLinkedOrg])

    await linkedOrganisationsPostController.handler(mockRequest, mockH)

    expect(mockResponse.header).toHaveBeenCalledWith('Content-Type', 'text/csv')
    expect(mockResponse.header).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="linked-organisations.csv"'
    )
  })

  test('Should handle empty linked organisations', async () => {
    fetchJsonFromBackend.mockResolvedValue([])

    await linkedOrganisationsPostController.handler(mockRequest, mockH)

    const csvContent = mockH.response.mock.calls[0][0]
    const lines = csvContent.split('\n')
    expect(lines).toHaveLength(3)
    expect(lines[0]).toBe('Linked organisations report')
    expect(lines[2]).toContain('EPR Organisation Name')
  })

  test('Should escape CSV fields containing commas', async () => {
    const orgWithComma = {
      ...mockLinkedOrg,
      companyDetails: { name: 'Acme, Ltd', registrationNumber: '12345678' }
    }
    fetchJsonFromBackend.mockResolvedValue([orgWithComma])

    await linkedOrganisationsPostController.handler(mockRequest, mockH)

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

    await linkedOrganisationsPostController.handler(mockRequest, mockH)

    const csvContent = mockH.response.mock.calls[0][0]
    expect(csvContent).toContain('"Acme ""Best"" Ltd"')
  })

  test('Should redirect with error message on fetch failure', async () => {
    fetchJsonFromBackend.mockRejectedValue(new Error('Network error'))

    const result = await linkedOrganisationsPostController.handler(
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

    await linkedOrganisationsPostController.handler(mockRequest, mockH)

    expect(mockRequest.yar.set).toHaveBeenCalledWith(
      'error',
      'Custom backend error message'
    )
  })

  test('Should handle backend returning non-array data', async () => {
    fetchJsonFromBackend.mockResolvedValue({})

    await linkedOrganisationsPostController.handler(mockRequest, mockH)

    const csvContent = mockH.response.mock.calls[0][0]
    const lines = csvContent.split('\n')
    expect(lines).toHaveLength(3)
    expect(lines[0]).toBe('Linked organisations report')
  })

  test('Should handle null field values in CSV', async () => {
    const orgWithNullField = {
      ...mockLinkedOrg,
      orgId: null
    }
    fetchJsonFromBackend.mockResolvedValue([orgWithNullField])

    await linkedOrganisationsPostController.handler(mockRequest, mockH)

    const csvContent = mockH.response.mock.calls[0][0]
    expect(csvContent).toContain('Acme Ltd')
  })

  test('Should format linked date in CSV', async () => {
    fetchJsonFromBackend.mockResolvedValue([mockLinkedOrg])

    await linkedOrganisationsPostController.handler(mockRequest, mockH)

    const csvContent = mockH.response.mock.calls[0][0]
    expect(csvContent).toContain('15 June 2025 at 10:30am')
  })
})
