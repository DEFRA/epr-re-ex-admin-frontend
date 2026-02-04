import { vi, beforeEach, describe, test, expect } from 'vitest'

import { getCookieOptions } from './get-cookie-options.js'
import { TEST_COOKIE_PASSWORD } from '#server/common/test-helpers/test-constants.js'
import { config } from '#config/config.js'
import { getUserSession } from './get-user-session.js'
import { validateAndRefreshSession } from './validate-and-refresh-session.js'
import { mockUserSession } from '#server/common/test-helpers/fixtures.js'

vi.mock('#config/config.js')
vi.mock('./get-user-session.js')
vi.mock('./validate-and-refresh-session.js')

describe('#getCookieOptions', () => {
  const mockConfig = {
    'session.cookie.password': TEST_COOKIE_PASSWORD,
    'session.cookie.ttl': 1000,
    isProduction: false
  }

  beforeEach(() => {
    vi.clearAllMocks()
    config.get = vi.fn().mockImplementation((key) => mockConfig[key])
    validateAndRefreshSession.mockImplementation((userSession) =>
      Promise.resolve(userSession)
    )
  })

  test('Should return cookie configuration object', () => {
    const result = getCookieOptions()

    expect(result.cookie).toEqual({
      password: TEST_COOKIE_PASSWORD,
      path: '/',
      isSecure: false,
      isSameSite: 'Lax',
      clearInvalid: true,
      ttl: 1000
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
        email: 'test@example-user.test'
      }

      getUserSession.mockResolvedValue(mockUserSession)
      validateAndRefreshSession.mockResolvedValue(mockUserSession)

      const result = getCookieOptions()
      const mockRequest = {}

      const validation = await result.validate(mockRequest)

      expect(getUserSession).toHaveBeenCalledWith(mockRequest)
      expect(validateAndRefreshSession).toHaveBeenCalledWith(
        mockRequest,
        mockUserSession
      )
      expect(validation).toEqual({
        isValid: true,
        credentials: mockUserSession
      })
    })

    test('Should call getUserSession with request', async () => {
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

    test('Should return isValid false when validateAndRefreshSession throws error', async () => {
      getUserSession.mockResolvedValue({ sessionId: 'test' })
      validateAndRefreshSession.mockRejectedValue(
        new Error('Session expired and no refresh token available')
      )

      const result = getCookieOptions()
      const mockRequest = {}

      const validation = await result.validate(mockRequest)

      expect(validation).toEqual({ isValid: false })
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
      validateAndRefreshSession.mockResolvedValue(complexUserSession)

      const result = getCookieOptions()
      const mockRequest = {}

      const validation = await result.validate(mockRequest)

      expect(validateAndRefreshSession).toHaveBeenCalledWith(
        mockRequest,
        complexUserSession
      )
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
        validateAndRefreshSession.mockResolvedValue(value)

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
