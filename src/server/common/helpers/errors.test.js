import { vi } from 'vitest'

import { catchAll } from './errors.js'
import { createServer } from '#server/server.js'
import { statusCodes } from '../constants/status-codes.js'
import { createMockOidcServer } from '#server/common/test-helpers/mock-oidc.js'

describe('#errors integration', () => {
  let server

  beforeAll(async () => {
    createMockOidcServer()
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should provide expected Not Found page', async () => {
    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/non-existing-path'
    })

    expect(result).toEqual(expect.stringContaining('Page not found'))
    expect(statusCode).toBe(statusCodes.notFound)
  })
})

describe('#catchAll unit tests', () => {
  const mockLoggerError = vi.fn()
  const mockStack = 'Mock error stack'
  const mockMessage = 'Mock error message'

  const mockRequest = (statusCode, headers = {}) => {
    const response = {
      isBoom: true,
      message: mockMessage,
      data: { stack: mockStack },
      output: { statusCode, headers },
      headers
    }
    return {
      response,
      logger: { error: mockLoggerError }
    }
  }

  const mockToolkitView = vi.fn()
  const mockToolkitCode = vi.fn()
  const mockToolkitHeader = vi.fn()
  const mockContinue = Symbol('continue')
  const mockToolkit = {
    continue: mockContinue,
    view: mockToolkitView.mockReturnValue({
      code: mockToolkitCode.mockReturnValue({
        header: mockToolkitHeader.mockReturnThis()
      }),
      header: mockToolkitHeader.mockReturnThis()
    }),
    code: mockToolkitCode.mockReturnThis(),
    header: mockToolkitHeader.mockReturnThis()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('Should return early if response does not have isBoom property', () => {
    const nonBoomRequest = {
      response: {}
    }

    const result = catchAll(nonBoomRequest, mockToolkit)

    expect(result).toEqual(mockContinue)
    expect(mockToolkitView).not.toHaveBeenCalled()
    expect(mockLoggerError).not.toHaveBeenCalled()
  })

  test('Should render 403 template for forbidden status', () => {
    catchAll(mockRequest(statusCodes.forbidden), mockToolkit)

    expect(mockToolkitView).toHaveBeenCalledWith('403', {
      pageTitle: undefined
    })
    expect(mockToolkitCode).toHaveBeenCalledWith(statusCodes.forbidden)
    expect(mockLoggerError).not.toHaveBeenCalled()
  })

  test('Should render 404 template for not found status', () => {
    catchAll(mockRequest(statusCodes.notFound), mockToolkit)

    expect(mockToolkitView).toHaveBeenCalledWith('404', {
      pageTitle: undefined
    })
    expect(mockToolkitCode).toHaveBeenCalledWith(statusCodes.notFound)
    expect(mockLoggerError).not.toHaveBeenCalled()
  })

  test('Should render unauthorised template for unauthorised status', () => {
    catchAll(mockRequest(statusCodes.unauthorised), mockToolkit)

    expect(mockToolkitView).toHaveBeenCalledWith('unauthorised', {
      pageTitle: undefined
    })
    expect(mockToolkitCode).toHaveBeenCalledWith(statusCodes.unauthorised)
    expect(mockLoggerError).not.toHaveBeenCalled()
  })

  test('Should render 500 template for bad request status (uncategorised)', () => {
    catchAll(mockRequest(statusCodes.badRequest), mockToolkit)

    expect(mockToolkitView).toHaveBeenCalledWith('500', {
      pageTitle: undefined
    })
    expect(mockToolkitCode).toHaveBeenCalledWith(statusCodes.badRequest)
    expect(mockLoggerError).not.toHaveBeenCalled()
  })

  test('Should render 500 template and log error for internal server error', () => {
    const request = mockRequest(statusCodes.internalServerError)
    catchAll(request, mockToolkit)

    expect(mockToolkitView).toHaveBeenCalledWith('500', {
      pageTitle: undefined
    })
    expect(mockToolkitCode).toHaveBeenCalledWith(
      statusCodes.internalServerError
    )
    expect(mockLoggerError).toHaveBeenCalledWith({
      err: request.response,
      message: mockMessage
    })
  })

  test('Should log error for any status >= 500', () => {
    const customServerErrorCode = 503
    const request = mockRequest(customServerErrorCode)
    catchAll(request, mockToolkit)

    expect(mockToolkitView).toHaveBeenCalledWith('500', {
      pageTitle: undefined
    })
    expect(mockToolkitCode).toHaveBeenCalledWith(customServerErrorCode)
    expect(mockLoggerError).toHaveBeenCalledWith({
      err: request.response,
      message: mockMessage
    })
  })

  test('Should preserve original headers except content-type', () => {
    const originalHeaders = {
      'x-custom-header': 'custom-value',
      'content-type': 'application/json',
      'cache-control': 'no-cache'
    }

    catchAll(mockRequest(statusCodes.notFound, originalHeaders), mockToolkit)

    expect(mockToolkitHeader).toHaveBeenCalledWith(
      'x-custom-header',
      'custom-value'
    )
    expect(mockToolkitHeader).toHaveBeenCalledWith('cache-control', 'no-cache')
    expect(mockToolkitHeader).not.toHaveBeenCalledWith(
      'content-type',
      'application/json'
    )
  })

  test('Should handle headers from response.output.headers when response.headers is not available', () => {
    const request = {
      response: {
        isBoom: true,
        message: mockMessage,
        data: { stack: mockStack },
        output: {
          statusCode: statusCodes.notFound,
          headers: { 'x-output-header': 'output-value' }
        }
      },
      logger: { error: mockLoggerError }
    }

    catchAll(request, mockToolkit)

    expect(mockToolkitHeader).toHaveBeenCalledWith(
      'x-output-header',
      'output-value'
    )
  })

  test('Should handle missing headers gracefully', () => {
    const request = {
      response: {
        isBoom: true,
        message: mockMessage,
        data: { stack: mockStack },
        output: { statusCode: statusCodes.notFound }
      },
      logger: { error: mockLoggerError }
    }

    catchAll(request, mockToolkit)

    expect(mockToolkitView).toHaveBeenCalledWith('404', {
      pageTitle: undefined
    })
    expect(mockToolkitCode).toHaveBeenCalledWith(statusCodes.notFound)
  })

  test('Should pass pageTitle from route settings to view context', () => {
    const request = {
      response: {
        isBoom: true,
        message: mockMessage,
        data: { stack: mockStack },
        output: { statusCode: statusCodes.unauthorised }
      },
      route: {
        settings: {
          app: { pageTitle: 'Demo Page' }
        }
      },
      logger: { error: mockLoggerError }
    }

    catchAll(request, mockToolkit)

    expect(mockToolkitView).toHaveBeenCalledWith('unauthorised', {
      pageTitle: 'Demo Page'
    })
    expect(mockToolkitCode).toHaveBeenCalledWith(statusCodes.unauthorised)
  })

  describe('Redirect after sign-in', () => {
    const mockRedirectRequest = ({
      statusCode = statusCodes.unauthorised,
      ...overrides
    } = {}) => ({
      ...mockRequest(statusCode),
      path: '/organisations',
      url: { search: '' },
      yar: { flash: vi.fn() },
      ...overrides
    })

    test('Should store request path in referrer flash on 401 error', () => {
      const request = mockRedirectRequest()

      catchAll(request, mockToolkit)

      expect(request.yar.flash).toHaveBeenCalledWith(
        'referrer',
        '/organisations'
      )
    })

    test('Should include query string in referrer flash on 401 error', () => {
      const request = mockRedirectRequest({
        url: { search: '?page=2&sort=name' }
      })

      catchAll(request, mockToolkit)

      expect(request.yar.flash).toHaveBeenCalledWith(
        'referrer',
        '/organisations?page=2&sort=name'
      )
    })

    test.each([
      { code: statusCodes.forbidden, name: '403 forbidden' },
      { code: statusCodes.notFound, name: '404 not found' },
      {
        code: statusCodes.internalServerError,
        name: '500 internal server error'
      }
    ])('Should not store referrer flash for $name status', ({ code }) => {
      const request = mockRedirectRequest({ statusCode: code })

      catchAll(request, mockToolkit)

      expect(request.yar.flash).not.toHaveBeenCalled()
    })

    test('Should handle missing yar on 401 error gracefully', () => {
      const request = mockRedirectRequest({ yar: undefined })

      expect(() => catchAll(request, mockToolkit)).not.toThrow()

      expect(mockToolkitView).toHaveBeenCalledWith('unauthorised', {
        pageTitle: undefined
      })
    })

    test('Should handle missing url on 401 error by storing path only', () => {
      const request = mockRedirectRequest({ url: undefined })

      catchAll(request, mockToolkit)

      expect(request.yar.flash).toHaveBeenCalledWith(
        'referrer',
        '/organisations'
      )
    })

    test('Should handle missing path on 401 error gracefully', () => {
      const request = mockRedirectRequest({ path: undefined })

      expect(() => catchAll(request, mockToolkit)).not.toThrow()

      expect(request.yar.flash).not.toHaveBeenCalled()
    })
  })
})
