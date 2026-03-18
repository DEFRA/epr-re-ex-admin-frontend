import { beforeEach, describe, expect, test, vi } from 'vitest'

import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { orsUploadGetController } from './controller.get.js'

vi.mock('#server/common/helpers/fetch-json-from-backend.js', () => ({
  fetchJsonFromBackend: vi.fn()
}))

const mockLoggerError = vi.hoisted(() => vi.fn())

vi.mock('#server/common/helpers/logging/logger.js', () => ({
  createLogger: vi.fn(() => ({
    error: mockLoggerError
  }))
}))

describe('orsUploadGetController', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      route: {
        settings: {
          app: {
            pageTitle: 'Upload ORS workbooks'
          }
        }
      }
    }

    mockH = {
      view: vi.fn()
    }
  })

  test('initiates ORS upload and renders upload page', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      uploadUrl: 'http://cdp-uploader/upload-123'
    })

    await orsUploadGetController.handler(mockRequest, mockH)

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      mockRequest,
      '/v1/overseas-sites/imports',
      {
        method: 'POST',
        body: JSON.stringify({
          redirectUrl: '/overseas-sites/imports/{importId}'
        })
      }
    )

    expect(mockH.view).toHaveBeenCalledWith('routes/ors-upload/upload', {
      pageTitle: 'Upload ORS workbooks',
      uploadUrl: 'http://cdp-uploader/upload-123',
      error: null
    })
  })

  test('handles upload initiation failure and renders error message', async () => {
    const error = new Error('Backend unavailable')
    fetchJsonFromBackend.mockRejectedValue(error)

    await orsUploadGetController.handler(mockRequest, mockH)

    expect(mockLoggerError).toHaveBeenCalledWith({
      err: error,
      message: 'Failed to initiate ORS workbook upload'
    })

    expect(mockH.view).toHaveBeenCalledWith('routes/ors-upload/upload', {
      pageTitle: 'Upload ORS workbooks',
      uploadUrl: null,
      error:
        'There was a problem starting the ORS upload. Please refresh and try again.'
    })
  })

  test('shows backend-not-enabled message when initiate route is missing', async () => {
    const error = {
      isBoom: true,
      output: {
        statusCode: 404
      }
    }

    fetchJsonFromBackend.mockRejectedValue(error)

    await orsUploadGetController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith('routes/ors-upload/upload', {
      pageTitle: 'Upload ORS workbooks',
      uploadUrl: null,
      error:
        'ORS upload is not available yet because the backend initiate-import endpoint is not enabled.'
    })
  })

  test('shows redirect-config message when backend rejects invalid redirect', async () => {
    const error = {
      isBoom: true,
      output: {
        statusCode: 400
      }
    }

    fetchJsonFromBackend.mockRejectedValue(error)

    await orsUploadGetController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith('routes/ors-upload/upload', {
      pageTitle: 'Upload ORS workbooks',
      uploadUrl: null,
      error:
        'ORS upload could not be started due to invalid upload redirect configuration.'
    })
  })

  test('shows session-expired message when backend returns 401', async () => {
    const error = {
      isBoom: true,
      output: {
        statusCode: 401
      }
    }

    fetchJsonFromBackend.mockRejectedValue(error)

    await orsUploadGetController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith('routes/ors-upload/upload', {
      pageTitle: 'Upload ORS workbooks',
      uploadUrl: null,
      error: 'Your session has expired. Please sign in again and retry.'
    })
  })

  test('shows permission-denied message when backend returns 403', async () => {
    const error = {
      isBoom: true,
      output: {
        statusCode: 403
      }
    }

    fetchJsonFromBackend.mockRejectedValue(error)

    await orsUploadGetController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith('routes/ors-upload/upload', {
      pageTitle: 'Upload ORS workbooks',
      uploadUrl: null,
      error: 'You do not have permission to start ORS uploads.'
    })
  })
})
