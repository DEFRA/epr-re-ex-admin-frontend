import { beforeEach, describe, expect, test, vi } from 'vitest'

import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { orsUploadStatusGetController } from './controller.status.get.js'

vi.mock('#server/common/helpers/fetch-json-from-backend.js', () => ({
  fetchJsonFromBackend: vi.fn()
}))

const mockLoggerError = vi.hoisted(() => vi.fn())
const mockLoggerInfo = vi.hoisted(() => vi.fn())

vi.mock('#server/common/helpers/logging/logger.js', () => ({
  createLogger: vi.fn(() => ({
    error: mockLoggerError,
    info: mockLoggerInfo
  }))
}))

describe('orsUploadStatusGetController', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      params: {
        importId: 'import-123'
      },
      route: {
        settings: {
          app: {
            pageTitle: 'ORS upload status'
          }
        }
      }
    }

    mockH = {
      view: vi.fn()
    }
  })

  test('renders processing state with polling', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      status: 'processing',
      files: []
    })

    await orsUploadStatusGetController.handler(mockRequest, mockH)

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      mockRequest,
      '/v1/overseas-sites/imports/import-123'
    )

    expect(mockH.view).toHaveBeenCalledWith('routes/ors-upload/status', {
      pageTitle: 'ORS upload status',
      status: 'processing',
      importId: 'import-123',
      pollUrl: '/overseas-sites/imports/import-123',
      shouldPoll: true,
      files: [],
      successfulUploads: 0,
      failedUploads: 0,
      totalFiles: 0
    })

    expect(mockLoggerInfo).toHaveBeenCalledWith({
      message: 'Loaded ORS import status: import-123',
      event: {
        category: 'data',
        action: 'status-check-succeeded',
        reference: 'import-123',
        status: 'processing'
      },
      http: {
        response: {
          status_code: 200
        }
      }
    })
  })

  test('renders completed state with file summary', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      status: 'completed',
      files: [
        {
          fileName: 'site-a.xlsx',
          result: { status: 'success' }
        },
        {
          fileName: 'site-b.xlsx',
          result: {
            status: 'failure',
            errors: [
              {
                field: 'file',
                message: "Missing required 'ORS ID Log' worksheet"
              }
            ]
          }
        }
      ]
    })

    await orsUploadStatusGetController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith('routes/ors-upload/status', {
      pageTitle: 'ORS upload status',
      status: 'completed',
      importId: 'import-123',
      pollUrl: '/overseas-sites/imports/import-123',
      shouldPoll: false,
      files: [
        {
          fileName: 'site-a.xlsx',
          result: { status: 'success' }
        },
        {
          fileName: 'site-b.xlsx',
          result: {
            status: 'failure',
            errors: [
              {
                field: 'file',
                message: "Missing required 'ORS ID Log' worksheet"
              }
            ]
          }
        }
      ],
      successfulUploads: 1,
      failedUploads: 1,
      totalFiles: 2
    })
  })

  test('renders status with empty files when backend response has no files array', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      status: 'completed'
    })

    await orsUploadStatusGetController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith('routes/ors-upload/status', {
      pageTitle: 'ORS upload status',
      status: 'completed',
      importId: 'import-123',
      pollUrl: '/overseas-sites/imports/import-123',
      shouldPoll: false,
      files: [],
      successfulUploads: 0,
      failedUploads: 0,
      totalFiles: 0
    })
  })

  test('handles status fetch failure and renders failed view model', async () => {
    const error = new Error('Request failed')
    error.output = {
      statusCode: 500
    }
    fetchJsonFromBackend.mockRejectedValue(error)

    await orsUploadStatusGetController.handler(mockRequest, mockH)

    expect(mockLoggerError).toHaveBeenCalledWith({
      err: error,
      message: 'Failed to load ORS import status: import-123',
      event: {
        category: 'data',
        action: 'status-check-failed',
        reference: 'import-123',
        reason: 'Request failed'
      },
      http: {
        response: {
          status_code: 500
        }
      }
    })

    expect(mockH.view).toHaveBeenCalledWith('routes/ors-upload/status', {
      pageTitle: 'ORS upload status',
      status: 'failed',
      importId: 'import-123',
      pollUrl: '/overseas-sites/imports/import-123',
      shouldPoll: false,
      files: [],
      successfulUploads: 0,
      failedUploads: 0,
      totalFiles: 0,
      error: 'There was a problem loading this upload status. Please try again.'
    })
  })

  test('handles status fetch failure with missing message and status code', async () => {
    const error = {}
    fetchJsonFromBackend.mockRejectedValue(error)

    await orsUploadStatusGetController.handler(mockRequest, mockH)

    expect(mockLoggerError).toHaveBeenCalledWith({
      err: error,
      message: 'Failed to load ORS import status: import-123',
      event: {
        category: 'data',
        action: 'status-check-failed',
        reference: 'import-123',
        reason: 'Unknown error while loading ORS import status'
      },
      http: {
        response: {
          status_code: undefined
        }
      }
    })

    expect(mockH.view).toHaveBeenCalledWith('routes/ors-upload/status', {
      pageTitle: 'ORS upload status',
      status: 'failed',
      importId: 'import-123',
      pollUrl: '/overseas-sites/imports/import-123',
      shouldPoll: false,
      files: [],
      successfulUploads: 0,
      failedUploads: 0,
      totalFiles: 0,
      error: 'There was a problem loading this upload status. Please try again.'
    })
  })
})
