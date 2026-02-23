import { vi } from 'vitest'
import { prnTonnageGetController } from './controller.get.js'

describe('prn-tonnage GET controller', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      route: {
        settings: {
          app: { pageTitle: 'PRN tonnage' }
        }
      },
      yar: {
        get: vi.fn().mockReturnValue(null),
        clear: vi.fn()
      }
    }

    mockH = {
      view: vi.fn().mockReturnValue('rendered-view')
    }
  })

  test('Should render launch page without querying backend', async () => {
    await prnTonnageGetController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith('routes/prn-tonnage/index', {
      pageTitle: 'PRN tonnage',
      error: null
    })
  })

  test('Should display error message from session and clear it', async () => {
    mockRequest.yar.get.mockReturnValue('Download failed')

    await prnTonnageGetController.handler(mockRequest, mockH)

    expect(mockRequest.yar.get).toHaveBeenCalledWith('error')
    expect(mockRequest.yar.clear).toHaveBeenCalledWith('error')
    expect(mockH.view).toHaveBeenCalledWith(
      'routes/prn-tonnage/index',
      expect.objectContaining({
        error: 'Download failed'
      })
    )
  })
})
