import { vi, beforeEach, afterEach, describe, test, expect } from 'vitest'

import { getUserSession } from './get-user-session.js'
import { config } from '#config/config.js'

vi.mock('#config/config.js')

describe('#getUserSession', () => {
  const mockYarGet = vi.fn()
  const mockSessionName = 'test-session-cache'

  const mockRequest = {
    yar: {
      get: mockYarGet
    }
  }

  const mockUserSession = {
    sessionId: 'test-session-id-123',
    userId: 'user-456',
    email: 'test@example-user.test',
    roles: ['admin']
  }

  beforeEach(() => {
    vi.clearAllMocks()
    config.get = vi.fn().mockReturnValue(mockSessionName)
    mockYarGet.mockResolvedValue(mockUserSession)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  test('Should get session name from config', async () => {
    await getUserSession(mockRequest)

    expect(config.get).toHaveBeenCalledWith('session.cache.name')
  })

  test('Should retrieve user session from yar cache', async () => {
    await getUserSession(mockRequest)

    expect(mockYarGet).toHaveBeenCalledWith(mockSessionName)
  })

  test('Should return user session data', async () => {
    const result = await getUserSession(mockRequest)

    expect(result).toEqual(mockUserSession)
  })

  test('Should return complete user session object', async () => {
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

    mockYarGet.mockResolvedValue(complexUserSession)

    const result = await getUserSession(mockRequest)

    expect(result).toEqual(complexUserSession)
  })

  test('Should return null when yar.get throws an error', async () => {
    mockYarGet.mockRejectedValue(new Error('Session retrieval failed'))

    const result = await getUserSession(mockRequest)

    expect(result).toBeNull()
  })

  test('Should return null for TypeError', async () => {
    mockYarGet.mockRejectedValue(new TypeError('Invalid session data'))

    const result = await getUserSession(mockRequest)

    expect(result).toBeNull()
  })

  test('Should return null for custom error types', async () => {
    mockYarGet.mockRejectedValue(new Error('Custom session error'))

    const result = await getUserSession(mockRequest)

    expect(result).toBeNull()
  })

  test('Should return undefined if session does not exist', async () => {
    mockYarGet.mockResolvedValue(undefined)

    const result = await getUserSession(mockRequest)

    expect(result).toBeUndefined()
  })

  test('Should return null if session is null', async () => {
    mockYarGet.mockResolvedValue(null)

    const result = await getUserSession(mockRequest)

    expect(result).toBeNull()
  })

  test('Should handle yar.get async behavior', async () => {
    const delayedYarGet = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(mockUserSession), 10)
        })
    )

    const requestWithDelayedYar = {
      yar: {
        get: delayedYarGet
      }
    }

    const result = await getUserSession(requestWithDelayedYar)

    expect(delayedYarGet).toHaveBeenCalledWith(mockSessionName)
    expect(result).toEqual(mockUserSession)
  })

  test('Should handle network/connection errors gracefully', async () => {
    mockYarGet.mockRejectedValue(new Error('ECONNREFUSED'))

    const result = await getUserSession(mockRequest)

    expect(result).toBeNull()
  })

  test('Should handle corrupted session data errors', async () => {
    mockYarGet.mockRejectedValue(new SyntaxError('Unexpected token in JSON'))

    const result = await getUserSession(mockRequest)

    expect(result).toBeNull()
  })

  test('Should use session name from config', async () => {
    const customSessionName = 'custom-session-name'
    config.get = vi.fn().mockReturnValue(customSessionName)

    await getUserSession(mockRequest)

    expect(mockYarGet).toHaveBeenCalledWith(customSessionName)
  })
})
