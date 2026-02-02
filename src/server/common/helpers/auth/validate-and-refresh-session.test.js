import { vi, beforeEach, afterEach, describe, test, expect } from 'vitest'
import Jwt from '@hapi/jwt'
import {
  http,
  server as mswServer,
  HttpResponse
} from '../../../../../.vite/setup-msw.js'
import { config } from '#config/config.js'
import { createMockOidcServer } from '#server/common/test-helpers/mock-oidc.js'

import { validateAndRefreshSession } from './validate-and-refresh-session.js'
import { makeToken } from '#server/common/test-helpers/test-constants.js'

vi.mock('./create-user-session.js', () => ({
  createUserSession: vi.fn().mockResolvedValue(undefined)
}))

describe('#validateAndRefreshSession', () => {
  const mockUserSession = {
    sessionId: 'test-session-id',
    token: 'valid.jwt.token',
    refreshToken: 'refresh-token-123',
    userId: 'user-456'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    createMockOidcServer()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  test('Should return original session when token is valid and not approaching max age', async () => {
    const nowSec = Math.floor(Date.now() / 1000)
    const mockDecoded = {
      payload: {
        exp: nowSec + 3600,
        iat: nowSec - 1800
      }
    }
    const decodeSpy = vi.spyOn(Jwt.token, 'decode').mockReturnValue(mockDecoded)
    const verifyTimeSpy = vi
      .spyOn(Jwt.token, 'verifyTime')
      .mockImplementation(() => {})

    const result = await validateAndRefreshSession({}, mockUserSession)

    expect(decodeSpy).toHaveBeenCalledWith(mockUserSession.token)
    expect(verifyTimeSpy).toHaveBeenCalledWith(mockDecoded, { timeSkewSec: 60 })
    expect(result).toEqual(mockUserSession)
  })

  test('Should return original session when token has no iat claim', async () => {
    const nowSec = Math.floor(Date.now() / 1000)
    const mockDecoded = {
      payload: {
        exp: nowSec + 3600
      }
    }
    const decodeSpy = vi.spyOn(Jwt.token, 'decode').mockReturnValue(mockDecoded)
    const verifyTimeSpy = vi
      .spyOn(Jwt.token, 'verifyTime')
      .mockImplementation(() => {})

    const result = await validateAndRefreshSession({}, mockUserSession)

    expect(decodeSpy).toHaveBeenCalledWith(mockUserSession.token)
    expect(verifyTimeSpy).toHaveBeenCalledWith(mockDecoded, { timeSkewSec: 60 })
    expect(result).toEqual(mockUserSession)
  })

  test('Should return original session when token has no payload', async () => {
    const mockDecoded = {}
    const decodeSpy = vi.spyOn(Jwt.token, 'decode').mockReturnValue(mockDecoded)
    const verifyTimeSpy = vi
      .spyOn(Jwt.token, 'verifyTime')
      .mockImplementation(() => {})

    const result = await validateAndRefreshSession({}, mockUserSession)

    expect(decodeSpy).toHaveBeenCalledWith(mockUserSession.token)
    expect(verifyTimeSpy).toHaveBeenCalledWith(mockDecoded, { timeSkewSec: 60 })
    expect(result).toEqual(mockUserSession)
  })

  test('Should throw error when session expired and no refresh token available', async () => {
    const sessionWithoutRefreshToken = {
      sessionId: 'test-session-id',
      token: 'valid.jwt.token',
      userId: 'user-456'
    }

    vi.spyOn(Jwt.token, 'decode').mockImplementation(() => {
      throw new Error('Token expired')
    })

    await expect(
      validateAndRefreshSession({}, sessionWithoutRefreshToken)
    ).rejects.toThrow('Session expired and no refresh token available')
  })

  test('Should refresh tokens and update session when token is invalid', async () => {
    const decodeSpy = vi.spyOn(Jwt.token, 'decode').mockImplementation(() => {
      throw new Error('Token expired')
    })

    const newTokens = {
      access_token: makeToken('access'),
      refresh_token: makeToken('refresh'),
      token_type: 'Bearer',
      expires_in: 3600
    }

    const tenantId = config.get('entraId.tenantId')
    const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`

    mswServer.use(
      http.post(tokenEndpoint, async ({ request }) => {
        const body = await request.text()
        expect(body).toContain('grant_type=refresh_token')
        expect(body).toContain(
          `refresh_token=${encodeURIComponent(mockUserSession.refreshToken)}`
        )
        return HttpResponse.json(newTokens)
      })
    )

    const result = await validateAndRefreshSession({}, mockUserSession)

    expect(decodeSpy).toHaveBeenCalledWith(mockUserSession.token)
    expect(result).toEqual({
      ...mockUserSession,
      token: newTokens.access_token,
      refreshToken: newTokens.refresh_token
    })
  })

  test('Should refresh tokens when verifyTime throws error', async () => {
    const mockDecoded = { payload: { exp: Date.now() / 1000 - 3600 } }
    const decodeSpy = vi.spyOn(Jwt.token, 'decode').mockReturnValue(mockDecoded)
    const verifyTimeSpy = vi
      .spyOn(Jwt.token, 'verifyTime')
      .mockImplementation(() => {
        throw new Error('Token time verification failed')
      })

    const newTokens = {
      access_token: makeToken('access'),
      refresh_token: makeToken('refresh'),
      token_type: 'Bearer',
      expires_in: 3600
    }

    const tenantId = config.get('entraId.tenantId')
    const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`

    mswServer.use(
      http.post(tokenEndpoint, () => {
        return HttpResponse.json(newTokens)
      })
    )

    const result = await validateAndRefreshSession({}, mockUserSession)

    expect(decodeSpy).toHaveBeenCalledWith(mockUserSession.token)
    expect(verifyTimeSpy).toHaveBeenCalledWith(mockDecoded, { timeSkewSec: 60 })
    expect(result).toEqual({
      ...mockUserSession,
      token: newTokens.access_token,
      refreshToken: newTokens.refresh_token
    })
  })

  test('Should refresh tokens when token is approaching max age', async () => {
    const nowSec = Math.floor(Date.now() / 1000)
    const mockDecoded = {
      payload: {
        exp: nowSec + 600,
        iat: nowSec - 3400
      }
    }
    vi.spyOn(Jwt.token, 'decode').mockReturnValue(mockDecoded)
    vi.spyOn(Jwt.token, 'verifyTime').mockImplementation(() => {})

    const newTokens = {
      access_token: makeToken('access'),
      refresh_token: makeToken('refresh'),
      token_type: 'Bearer',
      expires_in: 3600
    }

    const tenantId = config.get('entraId.tenantId')
    const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`

    mswServer.use(
      http.post(tokenEndpoint, () => {
        return HttpResponse.json(newTokens)
      })
    )

    const result = await validateAndRefreshSession({}, mockUserSession)

    expect(result).toEqual({
      ...mockUserSession,
      token: newTokens.access_token,
      refreshToken: newTokens.refresh_token
    })
  })
})
