import { vi, beforeEach, afterEach, describe, test, expect } from 'vitest'

import callbackRoute from './index.js'
import { createUserSession } from '#server/common/helpers/auth/create-user-session.js'
import { randomUUID } from 'node:crypto'

vi.mock('#server/common/helpers/auth/create-user-session.js')
vi.mock('node:crypto')

describe('#callback route', () => {
  const mockToolkit = {
    view: vi.fn().mockReturnValue('unauthorised-view-result'),
    redirect: vi.fn().mockReturnValue('redirect-result')
  }

  const mockProfile = {
    displayName: 'John Doe',
    email: 'john.doe@fake-user.test',
    sub: 'user-id-123'
  }

  const mockToken = 'mock-jwt-token'
  const mockRefreshToken = 'mock-refresh-token'
  const mockSessionId = 'generated-session-id-456'

  beforeEach(() => {
    vi.clearAllMocks()

    mockToolkit.view.mockReturnValue('unauthorised-view-result')
    mockToolkit.redirect.mockReturnValue('redirect-result')
    createUserSession.mockResolvedValue()
    randomUUID.mockReturnValue(mockSessionId)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  test('Should have correct HTTP method', () => {
    expect(callbackRoute.method).toBe('GET')
  })

  test('Should have correct path', () => {
    expect(callbackRoute.path).toBe('/auth/callback')
  })

  test('Should have correct auth configuration', () => {
    expect(callbackRoute.options.auth.strategy).toBe('entra-id')
    expect(callbackRoute.options.auth.mode).toBe('try')
  })

  test('Should have async handler function', () => {
    expect(typeof callbackRoute.handler).toBe('function')
    expect(callbackRoute.handler.constructor.name).toBe('AsyncFunction')
  })

  test('Should return unauthorised view if not authenticated', async () => {
    const mockRequest = {
      auth: {
        isAuthenticated: false
      }
    }

    const result = await callbackRoute.handler(mockRequest, mockToolkit)

    expect(mockToolkit.view).toHaveBeenCalledWith('unauthorised')
    expect(result).toBe('unauthorised-view-result')
    expect(createUserSession).not.toHaveBeenCalled()
    expect(randomUUID).not.toHaveBeenCalled()
  })

  test('Should create session and redirect to home if authenticated', async () => {
    const mockRequest = {
      auth: {
        isAuthenticated: true,
        credentials: {
          profile: mockProfile,
          token: mockToken,
          refreshToken: mockRefreshToken
        }
      }
    }

    const result = await callbackRoute.handler(mockRequest, mockToolkit)

    expect(randomUUID).toHaveBeenCalledTimes(1)
    expect(createUserSession).toHaveBeenCalledWith(mockRequest, {
      sessionId: mockSessionId,
      displayName: mockProfile.displayName,
      isAuthenticated: true,
      token: mockToken,
      refreshToken: mockRefreshToken
    })
    expect(mockToolkit.redirect).toHaveBeenCalledWith('/')
    expect(result).toBe('redirect-result')
  })

  test('Should handle missing displayName in profile', async () => {
    const profileWithoutDisplayName = {
      email: 'test@fake-user.test',
      sub: 'user-id'
    }

    const mockRequest = {
      auth: {
        isAuthenticated: true,
        credentials: {
          profile: profileWithoutDisplayName,
          token: mockToken,
          refreshToken: mockRefreshToken
        }
      }
    }

    await callbackRoute.handler(mockRequest, mockToolkit)

    expect(createUserSession).toHaveBeenCalledWith(mockRequest, {
      sessionId: mockSessionId,
      displayName: '',
      isAuthenticated: true,
      token: mockToken,
      refreshToken: mockRefreshToken
    })
  })

  test('Should handle empty profile object', async () => {
    const mockRequest = {
      auth: {
        isAuthenticated: true,
        credentials: {
          profile: {},
          token: mockToken,
          refreshToken: mockRefreshToken
        }
      }
    }

    await callbackRoute.handler(mockRequest, mockToolkit)

    expect(createUserSession).toHaveBeenCalledWith(mockRequest, {
      sessionId: mockSessionId,
      displayName: '',
      isAuthenticated: true,
      token: mockToken,
      refreshToken: mockRefreshToken
    })
  })

  test('Should generate unique session ID for each request', async () => {
    const sessionIds = ['session-1', 'session-2', 'session-3']
    randomUUID
      .mockReturnValueOnce(sessionIds[0])
      .mockReturnValueOnce(sessionIds[1])
      .mockReturnValueOnce(sessionIds[2])

    const mockRequest = {
      auth: {
        isAuthenticated: true,
        credentials: {
          profile: mockProfile,
          token: mockToken,
          refreshToken: mockRefreshToken
        }
      }
    }

    for (let i = 0; i < 3; i++) {
      await callbackRoute.handler(mockRequest, mockToolkit)

      expect(createUserSession).toHaveBeenNthCalledWith(
        i + 1,
        mockRequest,
        expect.objectContaining({
          sessionId: sessionIds[i]
        })
      )
    }

    expect(randomUUID).toHaveBeenCalledTimes(3)
  })

  test('Should handle createUserSession errors', async () => {
    const error = new Error('Failed to create session')
    createUserSession.mockRejectedValue(error)

    const mockRequest = {
      auth: {
        isAuthenticated: true,
        credentials: {
          profile: mockProfile,
          token: mockToken,
          refreshToken: mockRefreshToken
        }
      }
    }

    await expect(
      callbackRoute.handler(mockRequest, mockToolkit)
    ).rejects.toThrow('Failed to create session')

    expect(randomUUID).toHaveBeenCalled()
    expect(mockToolkit.redirect).not.toHaveBeenCalled()
  })

  test('Should handle randomUUID errors', async () => {
    const error = new Error('Failed to generate UUID')
    randomUUID.mockImplementation(() => {
      throw error
    })

    const mockRequest = {
      auth: {
        isAuthenticated: true,
        credentials: {
          profile: mockProfile,
          token: mockToken,
          refreshToken: mockRefreshToken
        }
      }
    }

    await expect(
      callbackRoute.handler(mockRequest, mockToolkit)
    ).rejects.toThrow('Failed to generate UUID')

    expect(createUserSession).not.toHaveBeenCalled()
    expect(mockToolkit.redirect).not.toHaveBeenCalled()
  })

  test('Should include all required fields in user session', async () => {
    const mockRequest = {
      auth: {
        isAuthenticated: true,
        credentials: {
          profile: mockProfile,
          token: mockToken,
          refreshToken: mockRefreshToken
        }
      }
    }

    await callbackRoute.handler(mockRequest, mockToolkit)

    const expectedUserSession = {
      sessionId: mockSessionId,
      displayName: mockProfile.displayName,
      isAuthenticated: true,
      token: mockToken,
      refreshToken: mockRefreshToken
    }

    expect(createUserSession).toHaveBeenCalledWith(
      mockRequest,
      expectedUserSession
    )
  })

  test('Should handle missing credentials', async () => {
    const mockRequest = {
      auth: {
        isAuthenticated: true,
        credentials: undefined
      }
    }

    await expect(
      callbackRoute.handler(mockRequest, mockToolkit)
    ).rejects.toThrow()
  })

  test('Should handle missing profile in credentials', async () => {
    const mockRequest = {
      auth: {
        isAuthenticated: true,
        credentials: {
          token: mockToken,
          refreshToken: mockRefreshToken
        }
      }
    }

    await expect(
      callbackRoute.handler(mockRequest, mockToolkit)
    ).rejects.toThrow()
  })

  test('Should handle missing token in credentials', async () => {
    const mockRequest = {
      auth: {
        isAuthenticated: true,
        credentials: {
          profile: mockProfile,
          refreshToken: mockRefreshToken
        }
      }
    }

    await callbackRoute.handler(mockRequest, mockToolkit)

    expect(createUserSession).toHaveBeenCalledWith(
      mockRequest,
      expect.objectContaining({
        token: undefined,
        refreshToken: mockRefreshToken
      })
    )
  })

  test('Should handle different profile structures', async () => {
    const complexProfile = {
      displayName: 'Jane Smith',
      email: 'jane@fake-user.test',
      sub: 'user-456',
      given_name: 'Jane',
      family_name: 'Smith',
      roles: ['admin']
    }

    const mockRequest = {
      auth: {
        isAuthenticated: true,
        credentials: {
          profile: complexProfile,
          token: mockToken,
          refreshToken: mockRefreshToken
        }
      }
    }

    await callbackRoute.handler(mockRequest, mockToolkit)

    expect(createUserSession).toHaveBeenCalledWith(mockRequest, {
      sessionId: mockSessionId,
      displayName: complexProfile.displayName,
      isAuthenticated: true,
      token: mockToken,
      refreshToken: mockRefreshToken
    })
  })

  test('Should call functions in correct order for successful authentication', async () => {
    const callOrder = []

    randomUUID.mockImplementation(() => {
      callOrder.push('randomUUID')
      return mockSessionId
    })

    createUserSession.mockImplementation(async () => {
      callOrder.push('createUserSession')
    })

    mockToolkit.redirect.mockImplementation(() => {
      callOrder.push('redirect')
      return 'redirect-result'
    })

    const mockRequest = {
      auth: {
        isAuthenticated: true,
        credentials: {
          profile: mockProfile,
          token: mockToken,
          refreshToken: mockRefreshToken
        }
      }
    }

    await callbackRoute.handler(mockRequest, mockToolkit)

    expect(callOrder).toEqual(['randomUUID', 'createUserSession', 'redirect'])
  })
})
