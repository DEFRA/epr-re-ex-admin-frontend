import { vi, beforeEach, afterEach, describe, test, expect } from 'vitest'

import { createUserSession } from './create-user-session.js'
import { config } from '#config/config.js'

vi.mock('#config/config.js')

describe('#createUserSession', () => {
  const mockCookieAuthSet = vi.fn()
  const mockYarSet = vi.fn().mockResolvedValue(undefined)
  const mockSessionName = 'test-session-cache'

  const mockRequest = {
    cookieAuth: {
      set: mockCookieAuthSet
    },
    yar: {
      set: mockYarSet
    }
  }

  const mockPayload = {
    sessionId: 'test-session-id-123',
    userId: 'user-456',
    email: 'test@example.com',
    roles: ['admin']
  }

  beforeEach(() => {
    vi.clearAllMocks()
    config.get = vi.fn().mockReturnValue(mockSessionName)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  test('Should set cookie with sessionId from payload', async () => {
    await createUserSession(mockRequest, mockPayload)

    expect(mockCookieAuthSet).toHaveBeenCalledWith({
      sessionId: mockPayload.sessionId
    })
  })

  test('Should set session data in yar cache', async () => {
    await createUserSession(mockRequest, mockPayload)

    expect(mockYarSet).toHaveBeenCalledWith(mockSessionName, mockPayload)
  })

  test('Should get session name from config', async () => {
    await createUserSession(mockRequest, mockPayload)

    expect(config.get).toHaveBeenCalledWith('session.cache.name')
  })

  test('Should handle complete payload object', async () => {
    const complexPayload = {
      sessionId: 'session-789',
      userId: 'user-101',
      email: 'complex@test.com',
      roles: ['admin', 'user'],
      metadata: {
        createdAt: '2025-10-14',
        permissions: ['read', 'write']
      }
    }

    await createUserSession(mockRequest, complexPayload)

    expect(mockYarSet).toHaveBeenCalledWith(mockSessionName, complexPayload)
  })

  test('Should call both cookieAuth and yar', async () => {
    await createUserSession(mockRequest, mockPayload)

    expect(mockCookieAuthSet).toHaveBeenCalledTimes(1)
    expect(mockYarSet).toHaveBeenCalledTimes(1)
  })

  test('Should use session name from config', async () => {
    const customSessionName = 'custom-session-name'
    config.get = vi.fn().mockReturnValue(customSessionName)

    await createUserSession(mockRequest, mockPayload)

    expect(mockYarSet).toHaveBeenCalledWith(customSessionName, mockPayload)
  })

  test('Should handle minimal payload', async () => {
    const minimalPayload = {
      sessionId: 'minimal-session-123'
    }

    await createUserSession(mockRequest, minimalPayload)

    expect(mockCookieAuthSet).toHaveBeenCalledWith({
      sessionId: minimalPayload.sessionId
    })
    expect(mockYarSet).toHaveBeenCalledWith(mockSessionName, minimalPayload)
  })

  test('Should handle yar.set async behavior', async () => {
    const delayedYarSet = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(undefined), 10)
        })
    )

    const requestWithDelayedYar = {
      ...mockRequest,
      yar: {
        set: delayedYarSet
      }
    }

    await createUserSession(requestWithDelayedYar, mockPayload)

    expect(delayedYarSet).toHaveBeenCalledWith(mockSessionName, mockPayload)
  })
})
