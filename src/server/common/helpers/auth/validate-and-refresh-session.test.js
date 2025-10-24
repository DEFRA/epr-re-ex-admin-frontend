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

  test('Should return original session when token is valid', async () => {
    const mockDecoded = { payload: { exp: Date.now() / 1000 + 3600 } }
    const decodeSpy = vi.spyOn(Jwt.token, 'decode').mockReturnValue(mockDecoded)
    const verifyTimeSpy = vi
      .spyOn(Jwt.token, 'verifyTime')
      .mockImplementation(() => {})

    const result = await validateAndRefreshSession(mockUserSession)

    expect(decodeSpy).toHaveBeenCalledWith(mockUserSession.token)
    expect(verifyTimeSpy).toHaveBeenCalledWith(mockDecoded, { timeSkewSec: 60 })
    expect(result).toEqual(mockUserSession)
  })

  test('Should refresh tokens and update session when token is invalid', async () => {
    const decodeSpy = vi.spyOn(Jwt.token, 'decode').mockImplementation(() => {
      throw new Error('Token expired')
    })

    const newTokens = {
      access_token: 'new.access.token',
      refresh_token: 'new-refresh-token',
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

    const result = await validateAndRefreshSession(mockUserSession)

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
      access_token: 'refreshed.access.token',
      refresh_token: 'refreshed-refresh-token',
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

    const result = await validateAndRefreshSession(mockUserSession)

    expect(decodeSpy).toHaveBeenCalledWith(mockUserSession.token)
    expect(verifyTimeSpy).toHaveBeenCalledWith(mockDecoded, { timeSkewSec: 60 })
    expect(result).toEqual({
      ...mockUserSession,
      token: newTokens.access_token,
      refreshToken: newTokens.refresh_token
    })
  })
})
