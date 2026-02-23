import { vi } from 'vitest'
import { prnTonnagePostController } from './controller.post.js'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

vi.mock('#server/common/helpers/fetch-json-from-backend.js', () => ({
  fetchJsonFromBackend: vi.fn()
}))

describe('prn-tonnage POST controller', () => {
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

  test('Should generate CSV with correct headers and formatting', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      generatedAt: '2026-02-20T14:30:00.000Z',
      rows: [
        {
          organisationName: 'Acme Recycling',
          organisationId: 'ORG001',
          accreditationNumber: 'ACC-100',
          material: 'aluminium',
          tonnageBand: 'up_to_500',
          awaitingAuthorisationTonnage: 100,
          awaitingAcceptanceTonnage: 20,
          awaitingCancellationTonnage: 2,
          acceptedTonnage: 10,
          cancelledTonnage: 1
        }
      ]
    })

    await prnTonnagePostController.handler(mockRequest, mockH)

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      mockRequest,
      '/v1/prn-tonnage'
    )

    const expectedCsv = [
      '"PRN tonnage"',
      '',
      '"Tonnage of PRNs per accreditation, broken down by current PRN status. Includes awaiting authorisation, awaiting acceptance, awaiting cancellation, accepted and cancelled."',
      '',
      '"Data generated at: 20 February 2026 at 2:30pm"',
      '',
      '"Organisation Name","Organisation ID","Accreditation Number","Material","Tonnage Band","Awaiting authorisation","Awaiting acceptance","Awaiting cancellation","Accepted","Cancelled"',
      '"Acme Recycling","ORG001","ACC-100","Aluminium","Up to 500 tonnes","100","20","2","10","1"'
    ].join('\n')

    expect(mockH.response).toHaveBeenCalledWith(expectedCsv)
    expect(mockResponse.header).toHaveBeenCalledWith('Content-Type', 'text/csv')
    expect(mockResponse.header).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="prn-tonnage.csv"'
    )
  })

  test('Should handle empty data rows', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      generatedAt: '2026-02-20T12:00:00.000Z',
      rows: []
    })

    await prnTonnagePostController.handler(mockRequest, mockH)

    const csvContent = mockH.response.mock.calls[0][0]
    expect(csvContent).toContain('"PRN tonnage"')
    expect(csvContent).toContain(
      '"Organisation Name","Organisation ID","Accreditation Number","Material","Tonnage Band","Awaiting authorisation","Awaiting acceptance","Awaiting cancellation","Accepted","Cancelled"'
    )
    expect(csvContent).not.toContain('"Acme Recycling"')
  })

  test('Should redirect with default error message on failure', async () => {
    fetchJsonFromBackend.mockRejectedValue(new Error('Network error'))

    const result = await prnTonnagePostController.handler(mockRequest, mockH)

    expect(mockRequest.yar.set).toHaveBeenCalledWith(
      'error',
      'There was a problem downloading the PRN tonnage data. Please try again.'
    )
    expect(mockH.redirect).toHaveBeenCalledWith('/prn-tonnage/results')
    expect(result).toBe('redirect-response')
  })

  test('Should use error message from backend when available', async () => {
    const error = new Error('Backend error')
    error.output = { payload: { message: 'Custom backend error message' } }
    fetchJsonFromBackend.mockRejectedValue(error)

    await prnTonnagePostController.handler(mockRequest, mockH)

    expect(mockRequest.yar.set).toHaveBeenCalledWith(
      'error',
      'Custom backend error message'
    )
  })
})
