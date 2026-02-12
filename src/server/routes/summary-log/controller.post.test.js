import { vi, describe, test, beforeEach, expect } from 'vitest'
import { summaryLogUploadsReportPostController } from './controller.post.js'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

vi.mock('#server/common/helpers/fetch-json-from-backend.js', () => ({
  fetchJsonFromBackend: vi.fn()
}))

vi.mock('#server/common/helpers/formatters.js', () => ({
  formatDateTime: vi.fn((isoString) => {
    if (!isoString) return ''
    if (isoString.includes('2026-02-06T14:30')) {
      return '6 February 2026 at 2:30pm'
    }
    if (isoString.includes('2026-01-15T10:00')) {
      return '15 January 2026 at 10:00am'
    }
    return '6 February 2026 at 2:30pm' // default for "Data generated at"
  })
}))

const mockErrorFn = vi.hoisted(() => vi.fn())

vi.mock('#server/common/helpers/logging/logger.js', () => ({
  createLogger: vi.fn(() => ({
    error: mockErrorFn
  }))
}))

describe('summaryLogUploadsReportPostController', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      yar: {
        set: vi.fn()
      }
    }

    mockH = {
      response: vi.fn().mockReturnThis(),
      header: vi.fn().mockReturnThis(),
      redirect: vi.fn()
    }
  })

  test('generates CSV with correct headers', async () => {
    const mockData = {
      summaryLogUploads: [
        {
          appropriateAgency: 'EA',
          type: 'reprocessor',
          businessName: 'ACME Ltd',
          orgId: 12345,
          registrationNumber: 'REG1',
          accreditationNumber: 'ACC1',
          reprocessingSite: '7 Glass processing site, London, SW2A 0AA',
          packagingWasteCategory: 'glass',
          lastSuccessfulUpload: '2026-02-06T14:30:00.000Z',
          lastFailedUpload: '',
          successfulUploads: 5,
          failedUploads: 0
        },
        {
          appropriateAgency: 'NRW',
          type: 'exporter',
          businessName: 'Test Co',
          orgId: 99999,
          registrationNumber: 'REG2',
          accreditationNumber: '',
          reprocessingSite: '',
          packagingWasteCategory: 'plastic',
          lastSuccessfulUpload: '',
          lastFailedUpload: '2026-01-15T10:00:00.000Z',
          successfulUploads: 0,
          failedUploads: 3
        },
        {
          appropriateAgency: 'SEPA',
          type: 'reprocessor',
          businessName: 'Pending Reg Ltd',
          orgId: 55555,
          registrationNumber: '',
          accreditationNumber: '',
          reprocessingSite: '10 Processing Lane, Glasgow, G1 1AA',
          packagingWasteCategory: 'paper',
          lastSuccessfulUpload: '2026-02-06T14:30:00.000Z',
          lastFailedUpload: '',
          successfulUploads: 2,
          failedUploads: 0
        }
      ],
      generatedAt: '2026-02-06T14:30:00.000Z'
    }

    fetchJsonFromBackend.mockResolvedValue(mockData)

    await summaryLogUploadsReportPostController.handler(mockRequest, mockH)

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      mockRequest,
      '/v1/organisations/registrations/summary-logs/reports/uploads'
    )

    const csv = mockH.response.mock.calls[0][0]

    // Verify entire CSV structure and content (note: no trailing newline after last row)
    const expectedCSV =
      '"Summary log uploads report"\n' +
      '\n' +
      '"Report showing summary log upload activity for all registered operators with uploads."\n' +
      '\n' +
      '"Data generated at: 6 February 2026 at 2:30pm"\n' +
      '\n' +
      '"Appropriate Agency","Type","Business Name","Org ID","Registration Number","Accreditation Number","Registered Reprocessing Site (UK)","Packaging Waste Category","Last Successful Upload","Last Failed Upload","Successful Uploads","Failed Uploads"\n' +
      '"EA","reprocessor","ACME Ltd","12345","REG1","ACC1","7 Glass processing site, London, SW2A 0AA","glass","6 February 2026 at 2:30pm","","5","0"\n' +
      '"NRW","exporter","Test Co","99999","REG2","-","-","plastic","","15 January 2026 at 10:00am","0","3"\n' +
      '"SEPA","reprocessor","Pending Reg Ltd","55555","-","-","10 Processing Lane, Glasgow, G1 1AA","paper","6 February 2026 at 2:30pm","","2","0"'

    expect(csv).toBe(expectedCSV)

    expect(mockH.header).toHaveBeenCalledWith('Content-Type', 'text/csv')
    expect(mockH.header).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="summary-log.csv"'
    )
  })

  test('handles backend fetch errors, logs them, and redirects with generic message', async () => {
    const fetchError = new Error('Network error')
    fetchError.stack = 'Error stack trace...'

    fetchJsonFromBackend.mockRejectedValue(fetchError)

    await summaryLogUploadsReportPostController.handler(mockRequest, mockH)

    expect(mockErrorFn).toHaveBeenCalledWith({
      err: fetchError,
      message: 'Failed to download summary log uploads report'
    })

    expect(mockRequest.yar.set).toHaveBeenCalledWith(
      'error',
      'There was a problem downloading the summary log uploads report. Please try again.'
    )
    expect(mockH.redirect).toHaveBeenCalledWith('/summary-log')
  })
})
