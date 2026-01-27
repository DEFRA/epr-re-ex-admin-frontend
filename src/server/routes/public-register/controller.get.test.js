import { vi } from 'vitest'
import { publicRegisterGetController } from './controller.get.js'

describe('public-register GET controller', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      yar: {
        get: vi.fn().mockReturnValue(null),
        clear: vi.fn().mockResolvedValue(undefined)
      },
      route: {
        settings: {
          app: { pageTitle: 'Public register' }
        }
      }
    }

    mockH = {
      view: vi.fn().mockReturnValue('rendered-view')
    }
  })

  test('Should render page with correct title and heading', async () => {
    await publicRegisterGetController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith('routes/public-register/index', {
      pageTitle: 'Public register',
      heading: 'Public register'
    })
  })

  test('Should read and clear flash error message', async () => {
    await publicRegisterGetController.handler(mockRequest, mockH)

    expect(mockRequest.yar.get).toHaveBeenCalledWith('error')
    expect(mockRequest.yar.clear).toHaveBeenCalledWith('error')
  })

  test('Should include error in context when flash error exists', async () => {
    const mockError = 'Failed to generate public register'
    mockRequest.yar.get.mockReturnValue(mockError)

    await publicRegisterGetController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith('routes/public-register/index', {
      pageTitle: 'Public register',
      heading: 'Public register',
      error: mockError
    })
  })

  test('Should not include error in context when no flash error exists', async () => {
    await publicRegisterGetController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith('routes/public-register/index', {
      pageTitle: 'Public register',
      heading: 'Public register'
    })
  })
})
