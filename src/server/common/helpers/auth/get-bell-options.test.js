import { vi, beforeEach, afterEach, describe, test, expect } from 'vitest'

import { getBellOptions } from './get-bell-options.js'
import { config } from '#config/config.js'
import Jwt from '@hapi/jwt'

vi.mock('#config/config.js')
vi.mock('@hapi/jwt')

describe('#getBellOptions', () => {
  const mockOidcConfig = {
    authorization_endpoint: 'https://example-oidc.test/auth',
    token_endpoint: 'https://example-oidc.test/token'
  }

  const mockConfig = {
    'entraId.clientId': 'test-client-id',
    'entraId.clientSecret': 'test-client-secret',
    'session.cookie.password': 'test-cookie-password',
    isProduction: false,
    appBaseUrl: 'https://example-app.test'
  }

  const mockJwtPayload = {
    name: 'John Doe',
    email: 'john.doe@example-user.test'
  }

  beforeEach(() => {
    vi.clearAllMocks()

    config.get = vi.fn().mockImplementation((key) => mockConfig[key])

    Jwt.token.decode = vi.fn().mockReturnValue({
      decoded: {
        payload: mockJwtPayload
      }
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  test('Should return correct provider configuration', () => {
    const result = getBellOptions(mockOidcConfig)

    expect(result.provider.name).toBe('entra-id')
    expect(result.provider.protocol).toBe('oauth2')
    expect(result.provider.useParamsAuth).toBe(true)
    expect(result.provider.auth).toBe(mockOidcConfig.authorization_endpoint)
    expect(result.provider.token).toBe(mockOidcConfig.token_endpoint)
    expect(result.provider.scope).toEqual([
      'openid',
      'profile',
      'email',
      'offline_access',
      'api://test-client-id/.default'
    ])
  })

  test('Should use config values for client credentials', () => {
    const result = getBellOptions(mockOidcConfig)

    expect(result.clientId).toBe('test-client-id')
    expect(result.clientSecret).toBe('test-client-secret')
    expect(result.password).toBe('test-cookie-password')
    expect(config.get).toHaveBeenCalledWith('entraId.clientId')
    expect(config.get).toHaveBeenCalledWith('entraId.clientSecret')
    expect(config.get).toHaveBeenCalledWith('session.cookie.password')
  })

  test('Should set isSecure and forceHttps based on production config', () => {
    const result = getBellOptions(mockOidcConfig)

    expect(result.isSecure).toBe(false)
    expect(result.forceHttps).toBe(false)
    expect(config.get).toHaveBeenCalledWith('isProduction')
  })

  test('Should set isSecure and forceHttps to true in production', () => {
    config.get = vi.fn().mockImplementation((key) => {
      if (key === 'isProduction') return true
      return mockConfig[key]
    })

    const result = getBellOptions(mockOidcConfig)

    expect(result.isSecure).toBe(true)
    expect(result.forceHttps).toBe(true)
  })

  test('Should return correct location callback URL', () => {
    const result = getBellOptions(mockOidcConfig)
    const mockRequest = { info: {} }
    const locationUrl = result.location(mockRequest)

    expect(locationUrl).toBe('https://example-app.test/auth/callback')
    expect(config.get).toHaveBeenCalledWith('appBaseUrl')
  })

  test('Should return provider params with response_mode', () => {
    const result = getBellOptions(mockOidcConfig)
    const providerParams = result.providerParams({})

    expect(providerParams).toEqual({
      response_mode: 'query'
    })
  })

  test('Should build profile from JWT token payload with full name', () => {
    const result = getBellOptions(mockOidcConfig)
    const mockCredentials = {
      token: 'mock-jwt-token'
    }

    result.provider.profile(mockCredentials, {}, {})

    expect(Jwt.token.decode).toHaveBeenCalledWith('mock-jwt-token')
    expect(mockCredentials.profile).toEqual({
      ...mockJwtPayload,
      sub: '',
      displayName: 'John Doe'
    })
  })

  test('Should handle displayName fallback to empty when no names available', () => {
    const noNamePayload = {
      email: 'user@example-user.test',
      sub: 'user-id'
    }

    Jwt.token.decode = vi.fn().mockReturnValue({
      decoded: {
        payload: noNamePayload
      }
    })

    const result = getBellOptions(mockOidcConfig)
    const mockCredentials = {
      token: 'mock-jwt-token'
    }

    result.provider.profile(mockCredentials, {}, {})

    expect(mockCredentials.profile).toEqual({
      ...noNamePayload,
      name: '',
      displayName: ''
    })
  })

  test('Should handle different app base URLs', () => {
    const testUrls = [
      'https://example-dev.test',
      'https://example-staging.test',
      'https://example-prod.test'
    ]

    testUrls.forEach((url) => {
      config.get = vi.fn().mockImplementation((key) => {
        if (key === 'appBaseUrl') return url
        return mockConfig[key]
      })

      const result = getBellOptions(mockOidcConfig)
      const mockRequest = { info: {} }
      const locationUrl = result.location(mockRequest)

      expect(locationUrl).toBe(`${url}/auth/callback`)
    })
  })

  describe('Redirection after SSO complete', () => {
    it('should store referrer in flash when present', () => {
      const bellConfig = getBellOptions(mockOidcConfig)

      const mockRequest = {
        info: {
          referrer: 'http://localhost:3000/dashboard'
        },
        yar: {
          flash: vi.fn()
        }
      }

      bellConfig.location(mockRequest)

      expect(mockRequest.yar.flash).toHaveBeenCalledWith(
        'referrer',
        '/dashboard'
      )
    })

    it('should not store referrer in flash when referrer is callback URL', async () => {
      const bellConfig = getBellOptions(mockOidcConfig)

      const mockRequest = {
        info: {
          referrer: 'http://localhost:3000/auth/callback'
        },
        yar: {
          flash: vi.fn()
        }
      }

      bellConfig.location(mockRequest)

      expect(mockRequest.yar.flash).not.toHaveBeenCalled()
    })

    it('should not store referrer in flash when referrer is not present in request', async () => {
      const bellConfig = getBellOptions(mockOidcConfig)

      const mockRequest = {
        info: {},
        yar: {
          flash: vi.fn()
        }
      }

      bellConfig.location(mockRequest)

      expect(mockRequest.yar.flash).not.toHaveBeenCalled()
    })
  })
})
