import { vi, beforeEach, afterEach, describe, test, expect } from 'vitest'
import { server, http, HttpResponse } from '../../../../../.vite/setup-msw.js'

import { getOidcConfig } from './get-oidc-config.js'
import { config } from '#config/config.js'

vi.mock('#config/config.js')

describe('#getOidcConfig', () => {
  const mockOidcUrl = 'https://fake-oidc.test/.well-known/openid-configuration'
  const mockOidcResponse = {
    authorization_endpoint: 'https://fake-oidc.test/oauth/authorize',
    token_endpoint: 'https://fake-oidc.test/oauth/token',
    end_session_endpoint: 'https://fake-oidc.test/oauth/logout',
    issuer: 'https://fake-oidc.test',
    userinfo_endpoint: 'https://fake-graph.test/userinfo'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    config.get = vi.fn().mockReturnValue(mockOidcUrl)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  test('Should fetch OIDC configuration successfully', async () => {
    server.use(
      http.get(mockOidcUrl, () => {
        return HttpResponse.json(mockOidcResponse)
      })
    )

    const result = await getOidcConfig()

    expect(config.get).toHaveBeenCalledWith(
      'entraId.oidcWellKnownConfigurationUrl'
    )
    expect(result).toEqual(mockOidcResponse)
  })

  test('Should include all required OIDC endpoints', async () => {
    server.use(
      http.get(mockOidcUrl, () => {
        return HttpResponse.json(mockOidcResponse)
      })
    )

    const result = await getOidcConfig()

    expect(result.authorization_endpoint).toBeDefined()
    expect(result.token_endpoint).toBeDefined()
    expect(result.end_session_endpoint).toBeDefined()
    expect(result.issuer).toBeDefined()
  })

  test('Should handle network errors gracefully', async () => {
    server.use(
      http.get(mockOidcUrl, () => {
        return HttpResponse.error()
      })
    )

    await expect(getOidcConfig()).rejects.toThrow()
  })

  test('Should handle 404 responses', async () => {
    server.use(
      http.get(mockOidcUrl, () => {
        return new HttpResponse(null, { status: 404 })
      })
    )

    await expect(getOidcConfig()).rejects.toThrow()
  })

  test('Should handle 500 server errors', async () => {
    server.use(
      http.get(mockOidcUrl, () => {
        return new HttpResponse(null, { status: 500 })
      })
    )

    await expect(getOidcConfig()).rejects.toThrow()
  })

  test('Should handle invalid JSON responses', async () => {
    server.use(
      http.get(mockOidcUrl, () => {
        return new HttpResponse('invalid json', {
          headers: { 'Content-Type': 'application/json' }
        })
      })
    )

    await expect(getOidcConfig()).rejects.toThrow()
  })

  test('Should handle timeout scenarios', async () => {
    server.use(
      http.get(mockOidcUrl, async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        return HttpResponse.json(mockOidcResponse)
      })
    )

    const result = await getOidcConfig()
    expect(result).toEqual(mockOidcResponse)
  })

  test('Should handle empty response body', async () => {
    server.use(
      http.get(mockOidcUrl, () => {
        return HttpResponse.json({})
      })
    )

    const result = await getOidcConfig()
    expect(result).toEqual({})
  })

  test('Should use config URL for requests', async () => {
    const customUrl =
      'https://fake-custom-oidc.test/.well-known/openid-configuration'
    config.get = vi.fn().mockReturnValue(customUrl)

    server.use(
      http.get(customUrl, () => {
        return HttpResponse.json(mockOidcResponse)
      })
    )

    const result = await getOidcConfig()

    expect(config.get).toHaveBeenCalledWith(
      'entraId.oidcWellKnownConfigurationUrl'
    )
    expect(result).toEqual(mockOidcResponse)
  })

  test('Should handle malformed URL from config', async () => {
    config.get = vi.fn().mockReturnValue('not-a-valid-url')

    await expect(getOidcConfig()).rejects.toThrow()
  })
})
