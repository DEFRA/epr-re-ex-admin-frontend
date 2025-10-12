import { vi } from 'vitest'

import { catchAll } from './errors.js'
import { createServer } from '../../server.js'
import { statusCodes } from '../constants/status-codes.js'

describe('#errors integration', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should provide expected Not Found page', async () => {
    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/non-existent-path'
    })

    expect(result).toEqual(expect.stringContaining('Page not found'))
    expect(statusCode).toBe(statusCodes.notFound)
  })
})

describe('#catchAll unit tests', () => {
  const mockLog = vi.fn()
  const mockStack = 'Mock error stack'
  const mockMessage = 'Mock error message'

  const mockRequest = (statusCode, headers = {}) => ({
    response: {
      isBoom: true,
      message: mockMessage,
      data: { stack: mockStack },
      output: { statusCode, headers },
      headers
    },
    log: mockLog
  })

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
    expect(mockLog).not.toHaveBeenCalled()
  })

  test('Should render 403 template for forbidden status', () => {
    catchAll(mockRequest(statusCodes.forbidden), mockToolkit)

    expect(mockToolkitView).toHaveBeenCalledWith('403')
    expect(mockToolkitCode).toHaveBeenCalledWith(statusCodes.forbidden)
    expect(mockLog).not.toHaveBeenCalled()
  })

  test('Should render 404 template for not found status', () => {
    catchAll(mockRequest(statusCodes.notFound), mockToolkit)

    expect(mockToolkitView).toHaveBeenCalledWith('404')
    expect(mockToolkitCode).toHaveBeenCalledWith(statusCodes.notFound)
    expect(mockLog).not.toHaveBeenCalled()
  })

  test('Should render unauthorised template for unauthorized status', () => {
    catchAll(mockRequest(statusCodes.unauthorized), mockToolkit)

    expect(mockToolkitView).toHaveBeenCalledWith('unauthorised')
    expect(mockToolkitCode).toHaveBeenCalledWith(statusCodes.unauthorized)
    expect(mockLog).not.toHaveBeenCalled()
  })

  test('Should render 500 template for bad request status (uncategorised)', () => {
    catchAll(mockRequest(statusCodes.badRequest), mockToolkit)

    expect(mockToolkitView).toHaveBeenCalledWith('500')
    expect(mockToolkitCode).toHaveBeenCalledWith(statusCodes.badRequest)
    expect(mockLog).not.toHaveBeenCalled()
  })

  test('Should render 500 template for unknown status codes (uncategorised)', () => {
    catchAll(mockRequest(statusCodes.imATeapot), mockToolkit)

    expect(mockToolkitView).toHaveBeenCalledWith('500')
    expect(mockToolkitCode).toHaveBeenCalledWith(statusCodes.imATeapot)
    expect(mockLog).not.toHaveBeenCalled()
  })

  test('Should render 500 template and log error for internal server error', () => {
    catchAll(mockRequest(statusCodes.internalServerError), mockToolkit)

    expect(mockToolkitView).toHaveBeenCalledWith('500')
    expect(mockToolkitCode).toHaveBeenCalledWith(
      statusCodes.internalServerError
    )
    expect(mockLog).toHaveBeenCalledWith(['error'], {
      statusCode: statusCodes.internalServerError,
      message: mockMessage,
      stack: mockStack
    })
  })

  test('Should log error for any status >= 500', () => {
    const customServerErrorCode = 503
    catchAll(mockRequest(customServerErrorCode), mockToolkit)

    expect(mockToolkitView).toHaveBeenCalledWith('500')
    expect(mockToolkitCode).toHaveBeenCalledWith(customServerErrorCode)
    expect(mockLog).toHaveBeenCalledWith(['error'], {
      statusCode: customServerErrorCode,
      message: mockMessage,
      stack: mockStack
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
      log: mockLog
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
      log: mockLog
    }

    catchAll(request, mockToolkit)

    expect(mockToolkitView).toHaveBeenCalledWith('404')
    expect(mockToolkitCode).toHaveBeenCalledWith(statusCodes.notFound)
  })
})
