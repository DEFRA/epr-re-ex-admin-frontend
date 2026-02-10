import { vi, describe, test, beforeEach, expect } from 'vitest'
import { summaryLogUploadsReportGetController } from './controller.get.js'

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
    if (isoString.includes('2026-02-05T09:00')) {
      return '5 February 2026 at 9:00am'
    }
    if (isoString.includes('2026-01-15T10:00')) {
      return '15 January 2026 at 10:00am'
    }
    return ''
  })
}))

const mockLoggerError = vi.hoisted(() => vi.fn())

vi.mock('#server/common/helpers/logging/logger.js', () => ({
  createLogger: vi.fn(() => ({
    error: mockLoggerError
  }))
}))

describe('summaryLogUploadsReportGetController', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      route: {
        settings: {
          app: {
            pageTitle: 'Summary Log Uploads Report'
          }
        }
      },
      yar: {
        get: vi.fn(),
        clear: vi.fn()
      }
    }

    mockH = {
      view: vi.fn()
    }
  })

  test('fetches data from backend and renders view with full data', async () => {
    const mockData = [
      {
        appropriateAgency: 'EA',
        type: 'reprocessor',
        businessName: 'ACME Ltd',
        orgId: 12345,
        registrationNumber: 'REG1',
        accreditationNo: 'ACC1',
        reprocessingSite: '7 Glass processing site, London',
        packagingWasteCategory: 'glass',
        lastSuccessfulUpload: '2026-02-06T14:30:00.000Z',
        lastFailedUpload: '2026-02-05T09:00:00.000Z',
        successfulUploads: 5,
        failedUploads: 1
      }
    ]

    fetchJsonFromBackend.mockResolvedValue(mockData)
    mockRequest.yar.get.mockReturnValue(null)

    await summaryLogUploadsReportGetController.handler(mockRequest, mockH)

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      mockRequest,
      '/v1/organisations/registrations/summary-logs/reports/uploads'
    )

    expect(mockH.view).toHaveBeenCalledWith(
      'routes/summary-log/uploads-report',
      {
        pageTitle: 'Summary Log Uploads Report',
        reportRows: [
          {
            appropriateAgency: 'EA',
            type: 'reprocessor',
            businessName: 'ACME Ltd',
            orgId: 12345,
            registrationNumber: 'REG1',
            accreditationNo: 'ACC1',
            reprocessingSite: '7 Glass processing site, London',
            packagingWasteCategory: 'glass',
            lastSuccessfulUpload: '6 February 2026 at 2:30pm',
            lastFailedUpload: '5 February 2026 at 9:00am',
            successfulUploads: 5,
            failedUploads: 1
          }
        ],
        totalRows: 1,
        error: null
      }
    )
  })

  test('handles data without accreditation and reprocessing site', async () => {
    const mockData = [
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
    mockRequest.yar.get.mockReturnValue(null)

    await summaryLogUploadsReportGetController.handler(mockRequest, mockH)

    const viewCall = mockH.view.mock.calls[0][1]
    expect(viewCall.reportRows[0].accreditationNo).toBe('-')
    expect(viewCall.reportRows[0].reprocessingSite).toBe('-')
    expect(viewCall.reportRows[0].lastSuccessfulUpload).toBe('')
    expect(viewCall.reportRows[0].lastFailedUpload).toBe(
      '15 January 2026 at 10:00am'
    )
  })

  test('handles backend fetch error and logs it', async () => {
    const fetchError = new Error('Network error')
    fetchError.stack = 'Error stack trace...'

    fetchJsonFromBackend.mockRejectedValue(fetchError)
    mockRequest.yar.get.mockReturnValue(null)

    await summaryLogUploadsReportGetController.handler(mockRequest, mockH)

    expect(mockLoggerError).toHaveBeenCalledWith({
      err: fetchError,
      message: 'Failed to load summary log uploads report'
    })

    expect(mockH.view).toHaveBeenCalledWith(
      'routes/summary-log/uploads-report',
      {
        pageTitle: 'Summary Log Uploads Report',
        reportRows: [],
        totalRows: 0,
        error:
          'There was a problem loading the summary log uploads report. Please try again.'
      }
    )
  })
})
