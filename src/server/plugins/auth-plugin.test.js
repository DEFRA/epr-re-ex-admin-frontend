import { vi, beforeEach, afterEach, describe, test, expect } from 'vitest'

import { authPlugin } from './auth-plugin.js'
import { getOidcConfig } from '#server/common/helpers/auth/get-oidc-config.js'
import { getBellOptions } from '#server/common/helpers/auth/get-bell-options.js'
import { getCookieOptions } from '#server/common/helpers/auth/get-cookie-options.js'

vi.mock('#server/common/helpers/auth/get-oidc-config.js')
vi.mock('#server/common/helpers/auth/get-bell-options.js')
vi.mock('#server/common/helpers/auth/get-cookie-options.js')

describe('#authPlugin', () => {
  const mockOidcConfig = {
    authorization_endpoint: 'https://fake-auth.test/oauth/authorize',
    token_endpoint: 'https://fake-auth.test/oauth/token',
    end_session_endpoint: 'https://fake-auth.test/oauth/logout'
  }

  const mockBellOptions = {
    provider: {
      name: 'entra-id',
      protocol: 'oauth2',
      auth: mockOidcConfig.authorization_endpoint,
      token: mockOidcConfig.token_endpoint
    },
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret'
  }

  const mockCookieOptions = {
    cookie: {
      password: 'test-cookie-password',
      path: '/',
      isSecure: false,
      isSameSite: 'Lax'
    },
    redirectTo: false
  }

  const mockServer = {
    auth: {
      strategy: vi.fn(),
      default: vi.fn()
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()

    getOidcConfig.mockResolvedValue(mockOidcConfig)
    getBellOptions.mockReturnValue(mockBellOptions)
    getCookieOptions.mockReturnValue(mockCookieOptions)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  test('Should have correct plugin name', () => {
    expect(authPlugin.plugin.name).toBe('auth-plugin')
  })

  test('Should register auth strategies successfully', async () => {
    await authPlugin.plugin.register(mockServer)

    expect(getOidcConfig).toHaveBeenCalledTimes(1)
    expect(getBellOptions).toHaveBeenCalledWith(mockOidcConfig)
    expect(getCookieOptions).toHaveBeenCalledTimes(1)

    expect(mockServer.auth.strategy).toHaveBeenCalledWith(
      'entra-id',
      'bell',
      mockBellOptions
    )
    expect(mockServer.auth.strategy).toHaveBeenCalledWith(
      'session',
      'cookie',
      mockCookieOptions
    )
    expect(mockServer.auth.default).toHaveBeenCalledWith('session')
  })

  test('Should call functions in correct order', async () => {
    const callOrder = []

    getOidcConfig.mockImplementation(async () => {
      callOrder.push('getOidcConfig')
      return mockOidcConfig
    })

    getBellOptions.mockImplementation(() => {
      callOrder.push('getBellOptions')
      return mockBellOptions
    })

    getCookieOptions.mockImplementation(() => {
      callOrder.push('getCookieOptions')
      return mockCookieOptions
    })

    mockServer.auth.strategy.mockImplementation((name) => {
      callOrder.push(`strategy-${name}`)
    })

    mockServer.auth.default.mockImplementation((strategy) => {
      callOrder.push(`default-${strategy}`)
    })

    await authPlugin.plugin.register(mockServer)

    expect(callOrder).toEqual([
      'getOidcConfig',
      'getBellOptions',
      'strategy-entra-id',
      'getCookieOptions',
      'strategy-session',
      'default-session'
    ])
  })

  test('Should pass OIDC config to getBellOptions', async () => {
    await authPlugin.plugin.register(mockServer)

    expect(getBellOptions).toHaveBeenCalledWith(mockOidcConfig)
    expect(getBellOptions).toHaveBeenCalledTimes(1)
  })

  test('Should register both auth strategies', async () => {
    await authPlugin.plugin.register(mockServer)

    expect(mockServer.auth.strategy).toHaveBeenCalledTimes(2)
    expect(mockServer.auth.strategy).toHaveBeenNthCalledWith(
      1,
      'entra-id',
      'bell',
      mockBellOptions
    )
    expect(mockServer.auth.strategy).toHaveBeenNthCalledWith(
      2,
      'session',
      'cookie',
      mockCookieOptions
    )
  })

  test('Should set session as default auth strategy', async () => {
    await authPlugin.plugin.register(mockServer)

    expect(mockServer.auth.default).toHaveBeenCalledWith('session')
    expect(mockServer.auth.default).toHaveBeenCalledTimes(1)
  })

  test('Should handle getOidcConfig errors', async () => {
    const error = new Error('Failed to fetch OIDC config')
    getOidcConfig.mockRejectedValue(error)

    await expect(authPlugin.plugin.register(mockServer)).rejects.toThrow(
      'Failed to fetch OIDC config'
    )

    expect(getBellOptions).not.toHaveBeenCalled()
    expect(getCookieOptions).not.toHaveBeenCalled()
    expect(mockServer.auth.strategy).not.toHaveBeenCalled()
    expect(mockServer.auth.default).not.toHaveBeenCalled()
  })

  test('Should handle getBellOptions errors', async () => {
    const error = new Error('Failed to get Bell options')
    getBellOptions.mockImplementation(() => {
      throw error
    })

    await expect(authPlugin.plugin.register(mockServer)).rejects.toThrow(
      'Failed to get Bell options'
    )

    expect(getOidcConfig).toHaveBeenCalled()
    expect(getBellOptions).toHaveBeenCalledWith(mockOidcConfig)
    expect(mockServer.auth.strategy).not.toHaveBeenCalled()
  })

  test('Should handle getCookieOptions errors', async () => {
    const error = new Error('Failed to get Cookie options')
    getCookieOptions.mockImplementation(() => {
      throw error
    })

    await expect(authPlugin.plugin.register(mockServer)).rejects.toThrow(
      'Failed to get Cookie options'
    )

    expect(getOidcConfig).toHaveBeenCalled()
    expect(getBellOptions).toHaveBeenCalled()
    expect(mockServer.auth.strategy).toHaveBeenCalledTimes(1)
  })

  test('Should handle server.auth.strategy errors', async () => {
    const error = new Error('Failed to register strategy')
    mockServer.auth.strategy.mockImplementation(() => {
      throw error
    })

    await expect(authPlugin.plugin.register(mockServer)).rejects.toThrow(
      'Failed to register strategy'
    )

    expect(getOidcConfig).toHaveBeenCalled()
    expect(getBellOptions).toHaveBeenCalled()
    expect(getCookieOptions).not.toHaveBeenCalled()
    expect(mockServer.auth.default).not.toHaveBeenCalled()
  })

  test('Should handle server.auth.default errors', async () => {
    const error = new Error('Failed to set default strategy')
    mockServer.auth.default.mockImplementation(() => {
      throw error
    })

    await expect(authPlugin.plugin.register(mockServer)).rejects.toThrow(
      'Failed to set default strategy'
    )

    expect(getOidcConfig).toHaveBeenCalled()
    expect(getBellOptions).toHaveBeenCalled()
    expect(getCookieOptions).toHaveBeenCalled()
    expect(mockServer.auth.strategy).toHaveBeenCalledTimes(2)
  })

  test('Should work with different OIDC configurations', async () => {
    const differentOidcConfig = {
      authorization_endpoint: 'https://fake-provider-2.test/auth',
      token_endpoint: 'https://fake-provider-2.test/token',
      end_session_endpoint: 'https://fake-provider-2.test/logout'
    }

    getOidcConfig.mockResolvedValue(differentOidcConfig)

    await authPlugin.plugin.register(mockServer)

    expect(getBellOptions).toHaveBeenCalledWith(differentOidcConfig)
    expect(mockServer.auth.strategy).toHaveBeenCalledWith(
      'entra-id',
      'bell',
      mockBellOptions
    )
  })

  test('Should maintain plugin structure', () => {
    expect(authPlugin).toHaveProperty('plugin')
    expect(authPlugin.plugin).toHaveProperty('name')
    expect(authPlugin.plugin).toHaveProperty('register')
    expect(typeof authPlugin.plugin.register).toBe('function')
  })
})
