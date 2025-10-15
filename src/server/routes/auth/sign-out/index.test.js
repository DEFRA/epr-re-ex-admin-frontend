import { vi, beforeEach, afterEach, describe, test, expect } from 'vitest'

import signOutRoute from './index.js'
import { config } from '#config/config.js'
import { clearUserSession } from '#server/common/helpers/auth/clear-user-session.js'
import { getOidcConfig } from '#server/common/helpers/auth/get-oidc-config.js'

vi.mock('#config/config.js')
vi.mock('#server/common/helpers/auth/clear-user-session.js')
vi.mock('#server/common/helpers/auth/get-oidc-config.js')

describe('#signOut route', () => {
  const mockAppBaseUrl = 'https://fake-app.test'
  const mockOidcConfig = {
    end_session_endpoint: 'https://fake-oidc.test/oauth/logout'
  }

  const mockToolkit = {
    redirect: vi.fn().mockReturnValue('redirect-result')
  }

  beforeEach(() => {
    vi.clearAllMocks()

    mockToolkit.redirect.mockReturnValue('redirect-result')
    config.get = vi.fn().mockReturnValue(mockAppBaseUrl)
    getOidcConfig.mockResolvedValue(mockOidcConfig)
    clearUserSession.mockResolvedValue()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  test('Should have correct HTTP method', () => {
    expect(signOutRoute.method).toBe('GET')
  })

  test('Should have correct path', () => {
    expect(signOutRoute.path).toBe('/auth/sign-out')
  })

  test('Should have async handler function', () => {
    expect(typeof signOutRoute.handler).toBe('function')
    expect(signOutRoute.handler.constructor.name).toBe('AsyncFunction')
  })

  test('Should redirect to home if user is not authenticated', async () => {
    const mockRequest = {
      auth: {
        isAuthenticated: false
      }
    }

    const result = await signOutRoute.handler(mockRequest, mockToolkit)

    expect(mockToolkit.redirect).toHaveBeenCalledWith('/')
    expect(result).toBe('redirect-result')
    expect(clearUserSession).not.toHaveBeenCalled()
    expect(getOidcConfig).not.toHaveBeenCalled()
  })

  test('Should clear session and redirect to Entra logout for authenticated user', async () => {
    const mockRequest = {
      auth: {
        isAuthenticated: true
      }
    }

    const result = await signOutRoute.handler(mockRequest, mockToolkit)

    expect(clearUserSession).toHaveBeenCalledWith(mockRequest)
    expect(getOidcConfig).toHaveBeenCalledTimes(1)
    expect(config.get).toHaveBeenCalledWith('appBaseUrl')

    const expectedLogoutUrl = `${mockOidcConfig.end_session_endpoint}?post_logout_redirect_uri=${mockAppBaseUrl}/`
    expect(mockToolkit.redirect).toHaveBeenCalledWith(expectedLogoutUrl)
    expect(result).toBe('redirect-result')
  })

  test('Should construct logout URL with correct parameters', async () => {
    const mockRequest = {
      auth: {
        isAuthenticated: true
      }
    }

    await signOutRoute.handler(mockRequest, mockToolkit)

    const expectedUrl = encodeURI(
      `${mockOidcConfig.end_session_endpoint}?post_logout_redirect_uri=${mockAppBaseUrl}/`
    )
    expect(mockToolkit.redirect).toHaveBeenCalledWith(expectedUrl)
  })

  test('Should handle different app base URLs', async () => {
    const testUrls = [
      'https://fake-dev.test',
      'https://fake-staging.test',
      'https://fake-prod.test'
    ]

    for (const url of testUrls) {
      vi.clearAllMocks()
      config.get = vi.fn().mockReturnValue(url)
      getOidcConfig.mockResolvedValue(mockOidcConfig)
      clearUserSession.mockResolvedValue()

      const mockRequest = {
        auth: {
          isAuthenticated: true
        }
      }

      await signOutRoute.handler(mockRequest, mockToolkit)

      const expectedUrl = encodeURI(
        `${mockOidcConfig.end_session_endpoint}?post_logout_redirect_uri=${url}/`
      )
      expect(mockToolkit.redirect).toHaveBeenCalledWith(expectedUrl)
    }
  })

  test('Should handle different end session endpoints', async () => {
    const testEndpoints = [
      'https://fake-oidc-1.test/oauth/logout',
      'https://fake-oidc-2.test/oauth/logout',
      'https://fake-provider.test/logout'
    ]

    for (const endpoint of testEndpoints) {
      vi.clearAllMocks()
      config.get = vi.fn().mockReturnValue(mockAppBaseUrl)
      getOidcConfig.mockResolvedValue({ end_session_endpoint: endpoint })
      clearUserSession.mockResolvedValue()

      const mockRequest = {
        auth: {
          isAuthenticated: true
        }
      }

      await signOutRoute.handler(mockRequest, mockToolkit)

      const expectedUrl = encodeURI(
        `${endpoint}?post_logout_redirect_uri=${mockAppBaseUrl}/`
      )
      expect(mockToolkit.redirect).toHaveBeenCalledWith(expectedUrl)
    }
  })

  test('Should handle getOidcConfig errors', async () => {
    const error = new Error('Failed to get OIDC config')
    getOidcConfig.mockRejectedValue(error)

    const mockRequest = {
      auth: {
        isAuthenticated: true
      }
    }

    await expect(
      signOutRoute.handler(mockRequest, mockToolkit)
    ).rejects.toThrow('Failed to get OIDC config')

    expect(clearUserSession).toHaveBeenCalledWith(mockRequest)
    expect(mockToolkit.redirect).not.toHaveBeenCalled()
  })

  test('Should handle clearUserSession errors', async () => {
    const error = new Error('Failed to clear session')
    clearUserSession.mockImplementation(() => {
      throw error
    })

    const mockRequest = {
      auth: {
        isAuthenticated: true
      }
    }

    await expect(
      signOutRoute.handler(mockRequest, mockToolkit)
    ).rejects.toThrow('Failed to clear session')

    expect(getOidcConfig).not.toHaveBeenCalled()
    expect(mockToolkit.redirect).not.toHaveBeenCalled()
  })

  test('Should handle config.get errors', async () => {
    const error = new Error('Failed to get config')
    config.get.mockImplementation(() => {
      throw error
    })

    const mockRequest = {
      auth: {
        isAuthenticated: true
      }
    }

    await expect(
      signOutRoute.handler(mockRequest, mockToolkit)
    ).rejects.toThrow('Failed to get config')
  })

  test('Should call functions in correct order for authenticated user', async () => {
    const callOrder = []

    clearUserSession.mockImplementation(async () => {
      callOrder.push('clearUserSession')
    })

    getOidcConfig.mockImplementation(async () => {
      callOrder.push('getOidcConfig')
      return mockOidcConfig
    })

    config.get.mockImplementation(() => {
      callOrder.push('config.get')
      return mockAppBaseUrl
    })

    mockToolkit.redirect.mockImplementation(() => {
      callOrder.push('redirect')
      return 'redirect-result'
    })

    const mockRequest = {
      auth: {
        isAuthenticated: true
      }
    }

    await signOutRoute.handler(mockRequest, mockToolkit)

    expect(callOrder).toEqual([
      'clearUserSession',
      'getOidcConfig',
      'config.get',
      'redirect'
    ])
  })

  test('Should handle missing end_session_endpoint in OIDC config', async () => {
    getOidcConfig.mockResolvedValue({})

    const mockRequest = {
      auth: {
        isAuthenticated: true
      }
    }

    await signOutRoute.handler(mockRequest, mockToolkit)

    const expectedUrl = encodeURI(
      `undefined?post_logout_redirect_uri=${mockAppBaseUrl}/`
    )
    expect(mockToolkit.redirect).toHaveBeenCalledWith(expectedUrl)
  })

  test('Should handle URL encoding correctly', async () => {
    const urlWithSpaces = 'https://fake-app.test/app with spaces'
    config.get = vi.fn().mockReturnValue(urlWithSpaces)

    const mockRequest = {
      auth: {
        isAuthenticated: true
      }
    }

    await signOutRoute.handler(mockRequest, mockToolkit)

    const expectedUrl = encodeURI(
      `${mockOidcConfig.end_session_endpoint}?post_logout_redirect_uri=${urlWithSpaces}/`
    )
    expect(mockToolkit.redirect).toHaveBeenCalledWith(expectedUrl)
  })
})
