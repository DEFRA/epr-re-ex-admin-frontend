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

  test('generates CSV with correct headers and data including rows with and without accreditation', async () => {
    const mockData = [
      {
        appropriateAgency: 'EA',
        type: 'reprocessor',
        businessName: 'ACME Ltd',
        orgId: 12345,
        registrationNumber: 'REG1',
        accreditationNo: 'ACC1',
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
        accreditationNo: '',
        reprocessingSite: '',
        packagingWasteCategory: 'plastic',
        lastSuccessfulUpload: '',
        lastFailedUpload: '2026-01-15T10:00:00.000Z',
        successfulUploads: 0,
        failedUploads: 3
      }
    ]

    fetchJsonFromBackend.mockResolvedValue(mockData)

    await summaryLogUploadsReportPostController.handler(mockRequest, mockH)

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      mockRequest,
      '/v1/organisations/registrations/summary-logs/reports/uploads'
    )

    const csv = mockH.response.mock.calls[0][0]

    // Verify headers
    const expectedHeaders = [
      'Summary log uploads report',
      'Report showing summary log upload activity for all registered operators with uploads.',
      'Data generated at: 6 February 2026 at 2:30pm',
      'Appropriate Agency',
      'Type',
      'Business name',
      'Org ID',
      'Registration number',
      'Accreditation No',
      'Registered Reprocessing site (UK)',
      'Packaging Waste Category',
      'Last Successful Upload',
      'Last Failed Upload',
      'Successful Uploads',
      'Failed Uploads'
    ]
    expect(expectedHeaders.every((header) => csv.includes(header))).toBe(true)

    // Verify EA row (with accreditation)
    const eaRowContent = [
      '"EA"',
      '"reprocessor"',
      '"ACME Ltd"',
      '"12345"',
      '"REG1"',
      '"ACC1"',
      '"7 Glass processing site, London, SW2A 0AA"',
      '"glass"',
      '"6 February 2026 at 2:30pm"',
      '""', // empty lastFailedUpload
      '"5"',
      '"0"'
    ]
    expect(eaRowContent.every((content) => csv.includes(content))).toBe(true)

    // Verify NRW row (without accreditation - uses dashes)
    const nrwRowContent = [
      '"NRW"',
      '"exporter"',
      '"Test Co"',
      '"99999"',
      '"REG2"',
      '"-"', // no accreditation
      '"-"', // no reprocessing site
      '"plastic"',
      '""', // empty lastSuccessfulUpload
      '"15 January 2026 at 10:00am"',
      '"0"',
      '"3"'
    ]
    expect(nrwRowContent.every((content) => csv.includes(content))).toBe(true)

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
