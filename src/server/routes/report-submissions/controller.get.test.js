import { vi, describe, test, expect, beforeEach } from 'vitest'
import { reportSubmissionsGetController } from './controller.get.js'

describe('reportSubmissionsGetController', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      yar: {
        get: vi.fn().mockReturnValue(null),
        clear: vi.fn()
      }
    }

    mockH = {
      view: vi.fn().mockReturnValue('rendered-view')
    }
  })

  test('renders the report-submissions view', async () => {
    await reportSubmissionsGetController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith(
      'routes/report-submissions/index',
      expect.objectContaining({
        pageTitle: 'Report submissions'
      })
    )
  })

  test('reads and clears error flash from yar', async () => {
    mockRequest.yar.get.mockReturnValue('Something went wrong')

    await reportSubmissionsGetController.handler(mockRequest, mockH)

    expect(mockRequest.yar.get).toHaveBeenCalledWith('error')
    expect(mockRequest.yar.clear).toHaveBeenCalledWith('error')
  })

  test('passes error message to the view when present', async () => {
    mockRequest.yar.get.mockReturnValue('Download failed')

    await reportSubmissionsGetController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith(
      'routes/report-submissions/index',
      expect.objectContaining({
        error: 'Download failed'
      })
    )
  })

  test('passes null error to the view when no error in session', async () => {
    mockRequest.yar.get.mockReturnValue(null)

    await reportSubmissionsGetController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith(
      'routes/report-submissions/index',
      expect.objectContaining({
        error: null
      })
    )
  })
})
