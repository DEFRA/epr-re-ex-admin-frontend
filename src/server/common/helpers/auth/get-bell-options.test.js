import { vi, beforeEach, afterEach, describe, test, expect } from 'vitest'

import { getBellOptions } from './get-bell-options.js'
import { config } from '#config/config.js'
import Jwt from '@hapi/jwt'

vi.mock('#config/config.js')
vi.mock('@hapi/jwt')

describe('#getBellOptions', () => {
  const mockOidcConfig = {
    authorization_endpoint: 'https://fake-oidc.test/auth',
    token_endpoint: 'https://fake-oidc.test/token'
  }

  const mockConfig = {
    'entraId.clientId': 'test-client-id',
    'entraId.clientSecret': 'test-client-secret',
    'session.cookie.password': 'test-cookie-password',
    isProduction: false,
    appBaseUrl: 'https://fake-app.test'
  }

  const mockJwtPayload = {
    name: 'John Doe',
    given_name: 'John',
    family_name: 'Doe',
    email: 'john.doe@fake-user.test'
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
    expect(result.provider.scope).toEqual(['openid', 'profile', 'email'])
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
    const locationUrl = result.location()

    expect(locationUrl).toBe('https://fake-app.test/auth/callback')
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
      displayName: 'John Doe'
    })
  })

  test('Should handle displayName with partial names', () => {
    const partialPayload = {
      given_name: 'John',
      family_name: 'Doe',
      email: 'john.doe@fake-user.test'
    }

    Jwt.token.decode = vi.fn().mockReturnValue({
      decoded: {
        payload: partialPayload
      }
    })

    const result = getBellOptions(mockOidcConfig)
    const mockCredentials = {
      token: 'mock-jwt-token'
    }

    result.provider.profile(mockCredentials, {}, {})

    expect(mockCredentials.profile).toEqual({
      ...partialPayload,
      displayName: 'John Doe'
    })
  })

  test('Should handle displayName with only given name', () => {
    const givenNameOnlyPayload = {
      given_name: 'John',
      email: 'john@fake-user.test'
    }

    Jwt.token.decode = vi.fn().mockReturnValue({
      decoded: {
        payload: givenNameOnlyPayload
      }
    })

    const result = getBellOptions(mockOidcConfig)
    const mockCredentials = {
      token: 'mock-jwt-token'
    }

    result.provider.profile(mockCredentials, {}, {})

    expect(mockCredentials.profile).toEqual({
      ...givenNameOnlyPayload,
      displayName: 'John'
    })
  })

  test('Should handle displayName with only family name', () => {
    const familyNameOnlyPayload = {
      family_name: 'Doe',
      email: 'doe@fake-user.test'
    }

    Jwt.token.decode = vi.fn().mockReturnValue({
      decoded: {
        payload: familyNameOnlyPayload
      }
    })

    const result = getBellOptions(mockOidcConfig)
    const mockCredentials = {
      token: 'mock-jwt-token'
    }

    result.provider.profile(mockCredentials, {}, {})

    expect(mockCredentials.profile).toEqual({
      ...familyNameOnlyPayload,
      displayName: 'Doe'
    })
  })

  test('Should handle displayName fallback to empty when no names available', () => {
    const noNamePayload = {
      email: 'user@fake-user.test',
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
      displayName: ''
    })
  })

  test('Should prefer name field over constructed displayName', () => {
    const payloadWithName = {
      name: 'Jane Smith',
      given_name: 'John',
      family_name: 'Doe',
      email: 'jane@fake-user.test'
    }

    Jwt.token.decode = vi.fn().mockReturnValue({
      decoded: {
        payload: payloadWithName
      }
    })

    const result = getBellOptions(mockOidcConfig)
    const mockCredentials = {
      token: 'mock-jwt-token'
    }

    result.provider.profile(mockCredentials, {}, {})

    expect(mockCredentials.profile).toEqual({
      ...payloadWithName,
      displayName: 'Jane Smith'
    })
  })

  test('Should handle different app base URLs', () => {
    const testUrls = [
      'https://fake-dev.test',
      'https://fake-staging.test',
      'https://fake-prod.test'
    ]

    testUrls.forEach((url) => {
      config.get = vi.fn().mockImplementation((key) => {
        if (key === 'appBaseUrl') return url
        return mockConfig[key]
      })

      const result = getBellOptions(mockOidcConfig)
      const locationUrl = result.location()

      expect(locationUrl).toBe(`${url}/auth/callback`)
    })
  })
})
