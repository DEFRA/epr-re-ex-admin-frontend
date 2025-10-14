import { vi, beforeEach, afterEach, describe, test, expect } from 'vitest'

import { handleAuthFailure } from './auth-failure-handler.js'

describe('#handleAuthFailure', () => {
  const mockContinue = Symbol('continue')
  const mockCode = vi.fn()
  const mockView = vi.fn()

  const mockToolkit = {
    continue: mockContinue,
    view: mockView
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockView.mockReturnValue({
      code: mockCode.mockReturnThis()
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  test('Should return h.continue for non-Boom responses', () => {
    const mockRequest = {
      response: {}
    }

    const result = handleAuthFailure(mockRequest, mockToolkit)

    expect(result).toBe(mockContinue)
    expect(mockView).not.toHaveBeenCalled()
  })

  test('Should render unauthorised view for 401 status codes', () => {
    const mockRequest = {
      response: {
        isBoom: true,
        output: {
          statusCode: 401
        }
      }
    }

    handleAuthFailure(mockRequest, mockToolkit)

    expect(mockView).toHaveBeenCalledWith('views/unauthorised')
    expect(mockCode).toHaveBeenCalledWith(401)
  })

  test('Should return h.continue for non-401 Boom responses', () => {
    const mockRequest = {
      response: {
        isBoom: true,
        output: {
          statusCode: 403
        }
      }
    }

    const result = handleAuthFailure(mockRequest, mockToolkit)

    expect(result).toBe(mockContinue)
    expect(mockView).not.toHaveBeenCalled()
  })

  test('Should return h.continue for 500 Boom responses', () => {
    const mockRequest = {
      response: {
        isBoom: true,
        output: {
          statusCode: 500
        }
      }
    }

    const result = handleAuthFailure(mockRequest, mockToolkit)

    expect(result).toBe(mockContinue)
    expect(mockView).not.toHaveBeenCalled()
  })

  test('Should handle response without isBoom property', () => {
    const mockRequest = {
      response: {
        output: {
          statusCode: 401
        }
      }
    }

    const result = handleAuthFailure(mockRequest, mockToolkit)

    expect(result).toBe(mockContinue)
    expect(mockView).not.toHaveBeenCalled()
  })

  test('Should handle missing response.output gracefully', () => {
    const mockRequest = {
      response: {
        isBoom: true,
        output: {
          statusCode: 500
        }
      }
    }

    const result = handleAuthFailure(mockRequest, mockToolkit)

    expect(result).toBe(mockContinue)
    expect(mockView).not.toHaveBeenCalled()
  })

  test('Should handle various Boom error structures', () => {
    const mockRequest = {
      response: {
        isBoom: true,
        output: {
          statusCode: 401,
          headers: {}
        },
        message: 'Unauthorized'
      }
    }

    handleAuthFailure(mockRequest, mockToolkit)

    expect(mockView).toHaveBeenCalledWith('views/unauthorised')
    expect(mockCode).toHaveBeenCalledWith(401)
  })
})
