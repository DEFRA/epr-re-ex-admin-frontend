import { vi, beforeEach, afterEach, describe, test, expect } from 'vitest'

import { clearUserSession } from './clear-user-session.js'
import { config } from '#config/config.js'

vi.mock('#config/config.js')

describe('#clearUserSession', () => {
  const mockCookieAuthClear = vi.fn()
  const mockYarClear = vi.fn().mockResolvedValue(undefined)
  const mockSessionName = 'test-session-cache'

  const mockRequest = {
    cookieAuth: {
      clear: mockCookieAuthClear
    },
    yar: {
      clear: mockYarClear
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    config.get = vi.fn().mockReturnValue(mockSessionName)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  test('Should clear cookie auth', async () => {
    await clearUserSession(mockRequest)

    expect(mockCookieAuthClear).toHaveBeenCalledTimes(1)
  })

  test('Should get session name from config', async () => {
    await clearUserSession(mockRequest)

    expect(config.get).toHaveBeenCalledWith('session.cache.name')
  })

  test('Should clear yar session with correct session name', async () => {
    await clearUserSession(mockRequest)

    expect(mockYarClear).toHaveBeenCalledWith(mockSessionName)
  })

  test('Should call both cookieAuth.clear and yar.clear', async () => {
    await clearUserSession(mockRequest)

    expect(mockCookieAuthClear).toHaveBeenCalledTimes(1)
    expect(mockYarClear).toHaveBeenCalledTimes(1)
  })

  test('Should handle async yar.clear behavior', async () => {
    const delayedYarClear = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(undefined), 10)
        })
    )

    const requestWithDelayedYar = {
      ...mockRequest,
      yar: {
        clear: delayedYarClear
      }
    }

    await clearUserSession(requestWithDelayedYar)

    expect(delayedYarClear).toHaveBeenCalledWith(mockSessionName)
  })

  test('Should use session name from config variations', async () => {
    const customSessionName = 'custom-session-name'
    config.get = vi.fn().mockReturnValue(customSessionName)

    await clearUserSession(mockRequest)

    expect(mockYarClear).toHaveBeenCalledWith(customSessionName)
  })

  test('Should call cookieAuth.clear before yar.clear', async () => {
    const callOrder = []
    mockCookieAuthClear.mockImplementation(() => {
      callOrder.push('cookieAuth.clear')
    })
    mockYarClear.mockImplementation(() => {
      callOrder.push('yar.clear')
      return Promise.resolve()
    })

    await clearUserSession(mockRequest)

    expect(callOrder).toEqual(['cookieAuth.clear', 'yar.clear'])
  })

  test('Should handle different session names', async () => {
    const sessionNames = ['session-1', 'user-session', 'auth-cache']

    for (const sessionName of sessionNames) {
      vi.clearAllMocks()
      config.get = vi.fn().mockReturnValue(sessionName)

      await clearUserSession(mockRequest)

      expect(mockYarClear).toHaveBeenCalledWith(sessionName)
    }
  })
})
