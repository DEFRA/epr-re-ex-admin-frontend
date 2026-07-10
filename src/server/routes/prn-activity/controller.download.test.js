import { vi } from 'vitest'
import Boom from '@hapi/boom'
import { prnActivityDownloadController } from './controller.download.js'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

vi.mock('#server/common/helpers/fetch-json-from-backend.js', () => ({
  fetchJsonFromBackend: vi.fn()
}))

const expectedStatuses =
  'awaiting_authorisation,awaiting_acceptance,accepted,awaiting_cancellation,cancelled,deleted'

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

describe('prn-activity download controller', () => {
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

  test('Should fetch PRNs with correct statuses', async () => {
    mockFetchJsonFromBackend.mockResolvedValue({
      items: [],
      hasMore: false
    })

    await prnActivityDownloadController.handler(mockRequest, mockH)

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      mockRequest,
      `/v1/admin/packaging-recycling-notes?statuses=${expectedStatuses}`
    )
  })

  test('Should generate CSV with correct headers and data', async () => {
    mockFetchJsonFromBackend.mockResolvedValue({
      items: [mockPrn],
      hasMore: false
    })

    await prnActivityDownloadController.handler(mockRequest, mockH)

    const csvContent = mockH.response.mock.calls[0][0]
    const lines = csvContent.split('\n')
    expect(lines[0]).toBe(
      'PRN Number,Status,Issued To,Tonnage,Material,Process To Be Used,December Waste,Issued Date,Issued By,Position,Accreditation Number,Accreditation Year,Submitted To Regulator,Organisation Name,Waste Processing Type'
    )
    expect(csvContent).toContain('PRN-001')
    expect(csvContent).toContain('Glass')
    expect(csvContent).toContain('Reprocessor Ltd')
    expect(lines[1]).toBe(
      'PRN-001,awaiting_acceptance,Org A,100,Glass,R3,Yes,15/06/2025,John,Manager,ACC-2025-001,2025,,Reprocessor Ltd,reprocessor'
    )
  })

  test('Should set correct Content-Type and Content-Disposition headers', async () => {
    mockFetchJsonFromBackend.mockResolvedValue({
      items: [mockPrn],
      hasMore: false
    })

    await prnActivityDownloadController.handler(mockRequest, mockH)

    expect(mockResponse.header).toHaveBeenCalledWith('Content-Type', 'text/csv')
    expect(mockResponse.header).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="prn-activity.csv"'
    )
  })

  test('Should handle empty items', async () => {
    mockFetchJsonFromBackend.mockResolvedValue({
      items: [],
      hasMore: false
    })

    await prnActivityDownloadController.handler(mockRequest, mockH)

    const csvContent = mockH.response.mock.calls[0][0]
    const lines = csvContent.split('\n')
    expect(lines).toHaveLength(1)
    expect(lines[0]).toContain('PRN Number')
  })

  test('Should handle null data from backend', async () => {
    mockFetchJsonFromBackend.mockResolvedValue(null)

    await prnActivityDownloadController.handler(mockRequest, mockH)

    const csvContent = mockH.response.mock.calls[0][0]
    const lines = csvContent.split('\n')
    expect(lines).toHaveLength(1)
  })

  test('Should map isDecemberWaste to Yes/No', async () => {
    mockFetchJsonFromBackend.mockResolvedValue({
      items: [
        { ...mockPrn, isDecemberWaste: true },
        { ...mockPrn, prnNumber: 'PRN-002', isDecemberWaste: false }
      ],
      hasMore: false
    })

    await prnActivityDownloadController.handler(mockRequest, mockH)

    const csvContent = mockH.response.mock.calls[0][0]
    const lines = csvContent.split('\n')
    expect(lines[1]).toContain(',Yes,')
    expect(lines[2]).toContain(',No,')
  })

  test('Should use tradingName over name for issuedToOrganisation', async () => {
    mockFetchJsonFromBackend.mockResolvedValue({
      items: [
        {
          ...mockPrn,
          issuedToOrganisation: {
            name: 'Legal Name',
            tradingName: 'Trading Name'
          }
        }
      ],
      hasMore: false
    })

    await prnActivityDownloadController.handler(mockRequest, mockH)

    const csvContent = mockH.response.mock.calls[0][0]
    expect(csvContent).toContain('Trading Name')
    expect(csvContent).not.toContain('Legal Name')
  })

  test('Should handle null/undefined optional fields in CSV', async () => {
    mockFetchJsonFromBackend.mockResolvedValue({
      items: [
        {
          status: 'awaiting_authorisation',
          tonnage: 10,
          isDecemberWaste: false,
          issuedToOrganisation: null,
          prnNumber: undefined,
          material: undefined,
          processToBeUsed: undefined,
          issuedAt: null,
          issuedBy: null,
          accreditationNumber: undefined,
          accreditationYear: null,
          submittedToRegulator: undefined,
          organisationName: undefined,
          wasteProcessingType: undefined
        }
      ],
      hasMore: false
    })

    await prnActivityDownloadController.handler(mockRequest, mockH)

    const csvContent = mockH.response.mock.calls[0][0]
    const lines = csvContent.split('\n')
    expect(lines).toHaveLength(2)
    expect(lines[1]).toContain(',No,')
  })

  test('Should return empty string when org has no name or tradingName', async () => {
    mockFetchJsonFromBackend.mockResolvedValue({
      items: [
        {
          ...mockPrn,
          issuedToOrganisation: {},
          status: undefined
        }
      ],
      hasMore: false
    })

    await prnActivityDownloadController.handler(mockRequest, mockH)

    const csvContent = mockH.response.mock.calls[0][0]
    expect(csvContent).toBeDefined()
  })

  test('Should use name when tradingName is empty string', async () => {
    mockFetchJsonFromBackend.mockResolvedValue({
      items: [
        {
          ...mockPrn,
          issuedToOrganisation: { name: 'Legal Name', tradingName: '' }
        }
      ],
      hasMore: false
    })

    await prnActivityDownloadController.handler(mockRequest, mockH)

    const csvContent = mockH.response.mock.calls[0][0]
    expect(csvContent).toContain('Legal Name')
  })

  test('Should prefix fields starting with formula-injection characters', async () => {
    mockFetchJsonFromBackend.mockResolvedValue({
      items: [{ ...mockPrn, accreditationNumber: '=SUM(A1)' }],
      hasMore: false
    })

    await prnActivityDownloadController.handler(mockRequest, mockH)

    const csvContent = mockH.response.mock.calls[0][0]
    expect(csvContent).toContain("'=SUM(A1)")
  })

  test('Should redirect with error message on fetch failure', async () => {
    mockFetchJsonFromBackend.mockRejectedValue(new Error('Network error'))

    const result = await prnActivityDownloadController.handler(
      mockRequest,
      mockH
    )

    expect(mockRequest.yar.set).toHaveBeenCalledWith(
      'error',
      'There was a problem downloading the PRN activity data. Please try again.'
    )
    expect(mockH.redirect).toHaveBeenCalledWith('/prn-activity')
    expect(result).toBe('redirect-response')
  })

  test('Should use error message from backend when available', async () => {
    const error = Boom.badRequest('Custom backend error message')
    mockFetchJsonFromBackend.mockRejectedValue(error)

    await prnActivityDownloadController.handler(mockRequest, mockH)

    expect(mockRequest.yar.set).toHaveBeenCalledWith(
      'error',
      'Custom backend error message'
    )
  })

  test('Should fetch all pages when hasMore is true', async () => {
    mockFetchJsonFromBackend
      .mockResolvedValueOnce({
        items: [{ ...mockPrn, prnNumber: 'PRN-001' }],
        hasMore: true,
        nextCursor: 'cursor-1'
      })
      .mockResolvedValueOnce({
        items: [{ ...mockPrn, prnNumber: 'PRN-002' }],
        hasMore: true,
        nextCursor: 'cursor-2'
      })
      .mockResolvedValueOnce({
        items: [{ ...mockPrn, prnNumber: 'PRN-003' }],
        hasMore: false
      })

    await prnActivityDownloadController.handler(mockRequest, mockH)

    expect(fetchJsonFromBackend).toHaveBeenCalledTimes(3)
    expect(fetchJsonFromBackend).toHaveBeenNthCalledWith(
      2,
      mockRequest,
      expect.stringContaining('cursor=cursor-1')
    )
    expect(fetchJsonFromBackend).toHaveBeenNthCalledWith(
      3,
      mockRequest,
      expect.stringContaining('cursor=cursor-2')
    )

    const csvContent = mockH.response.mock.calls[0][0]
    expect(csvContent).toContain('PRN-001')
    expect(csvContent).toContain('PRN-002')
    expect(csvContent).toContain('PRN-003')
  })
})
