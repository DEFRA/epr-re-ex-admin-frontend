import { vi, beforeEach, afterEach, describe, test, expect } from 'vitest'

import { getCookieOptions } from './get-cookie-options.js'
import { config } from '#config/config.js'
import { getUserSession } from './get-user-session.js'

vi.mock('#config/config.js')
vi.mock('./get-user-session.js')

describe('#getCookieOptions', () => {
  const mockConfig = {
    'session.cookie.password': 'test-cookie-password',
    isProduction: false
  }

  beforeEach(() => {
    vi.clearAllMocks()
    config.get = vi.fn().mockImplementation((key) => mockConfig[key])
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  test('Should return cookie configuration object', () => {
    const result = getCookieOptions()

    expect(result.cookie).toEqual({
      password: 'test-cookie-password',
      path: '/',
      isSecure: false,
      isSameSite: 'Lax'
    })
  })

  test('Should use config values for password and isSecure', () => {
    getCookieOptions()

    expect(config.get).toHaveBeenCalledWith('session.cookie.password')
    expect(config.get).toHaveBeenCalledWith('isProduction')
  })

  test('Should set isSecure to true in production', () => {
    config.get = vi.fn().mockImplementation((key) => {
      if (key === 'isProduction') return true
      return mockConfig[key]
    })

    const result = getCookieOptions()

    expect(result.cookie.isSecure).toBe(true)
  })

  test('Should set redirectTo to false', () => {
    const result = getCookieOptions()

    expect(result.redirectTo).toBe(false)
  })

  test('Should return validate function', () => {
    const result = getCookieOptions()

    expect(typeof result.validate).toBe('function')
  })

  describe('validate function', () => {
    test('Should return isValid false when userSession is null', async () => {
      getUserSession.mockResolvedValue(null)

      const result = getCookieOptions()
      const mockRequest = {}

      const validation = await result.validate(mockRequest)

      expect(getUserSession).toHaveBeenCalledWith(mockRequest)
      expect(validation).toEqual({ isValid: false })
    })

    test('Should return isValid false when userSession is undefined', async () => {
      getUserSession.mockResolvedValue(undefined)

      const result = getCookieOptions()
      const mockRequest = {}

      const validation = await result.validate(mockRequest)

      expect(getUserSession).toHaveBeenCalledWith(mockRequest)
      expect(validation).toEqual({ isValid: false })
    })

    test('Should return isValid true with credentials when userSession exists', async () => {
      const mockUserSession = {
        sessionId: 'test-session-123',
        userId: 'user-456',
        email: 'test@fake-user.test'
      }

      getUserSession.mockResolvedValue(mockUserSession)

      const result = getCookieOptions()
      const mockRequest = {}

      const validation = await result.validate(mockRequest)

      expect(getUserSession).toHaveBeenCalledWith(mockRequest)
      expect(validation).toEqual({
        isValid: true,
        credentials: mockUserSession
      })
    })

    test('Should call getUserSession with request', async () => {
      const mockUserSession = { sessionId: 'test-session' }
      getUserSession.mockResolvedValue(mockUserSession)

      const result = getCookieOptions()
      const mockRequest = { id: 'request-123' }

      await result.validate(mockRequest)

      expect(getUserSession).toHaveBeenCalledWith(mockRequest)
      expect(getUserSession).toHaveBeenCalledTimes(1)
    })

    test('Should handle getUserSession errors gracefully', async () => {
      getUserSession.mockRejectedValue(new Error('Session retrieval failed'))

      const result = getCookieOptions()
      const mockRequest = {}

      await expect(result.validate(mockRequest)).rejects.toThrow(
        'Session retrieval failed'
      )
    })

    test('Should handle different user session structures', async () => {
      const complexUserSession = {
        sessionId: 'session-789',
        userId: 'user-101',
        email: 'complex@test.com',
        roles: ['admin', 'user'],
        metadata: {
          createdAt: '2025-10-14',
          permissions: ['read', 'write']
        }
      }

      getUserSession.mockResolvedValue(complexUserSession)

      const result = getCookieOptions()
      const mockRequest = {}

      const validation = await result.validate(mockRequest)

      expect(validation).toEqual({
        isValid: true,
        credentials: complexUserSession
      })
    })

    test('Should handle falsy userSession values', async () => {
      const falsyValues = [null, undefined, false, 0, '', NaN]

      for (const value of falsyValues) {
        getUserSession.mockResolvedValue(value)

        const result = getCookieOptions()
        const validation = await result.validate({})

        expect(validation).toEqual({ isValid: false })
      }
    })

    test('Should handle truthy userSession values', async () => {
      const truthyValues = [
        { sessionId: 'test' },
        { user: 'john' },
        { id: 1 },
        'string-session',
        123,
        true,
        []
      ]

      for (const value of truthyValues) {
        getUserSession.mockResolvedValue(value)

        const result = getCookieOptions()
        const validation = await result.validate({})

        expect(validation).toEqual({
          isValid: true,
          credentials: value
        })
      }
    })
  })

  test('Should use different cookie passwords', () => {
    const passwords = ['password1', 'super-secret-key', 'dev-password']

    passwords.forEach((password) => {
      config.get = vi.fn().mockImplementation((key) => {
        if (key === 'session.cookie.password') return password
        return mockConfig[key]
      })

      const result = getCookieOptions()

      expect(result.cookie.password).toBe(password)
    })
  })

  test('Should maintain consistent cookie properties', () => {
    const result = getCookieOptions()

    expect(result.cookie.path).toBe('/')
    expect(result.cookie.isSameSite).toBe('Lax')
    expect(result.redirectTo).toBe(false)
  })
})
