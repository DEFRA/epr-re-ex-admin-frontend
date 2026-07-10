import { vi, beforeEach, afterEach, describe, test, expect } from 'vitest'

import signOutRoute from './index.js'
import { config } from '#config/config.js'
import { clearUserSession } from '#server/common/helpers/auth/clear-user-session.js'
import { getUserSession } from '#server/common/helpers/auth/get-user-session.js'
import { getOidcConfig } from '#server/common/helpers/auth/get-oidc-config.js'
import { auditSignOut } from '#server/common/helpers/auditing/index.js'
import {
  mockUserSession,
  asRequest
} from '#server/common/test-helpers/fixtures.js'

vi.mock('#server/common/helpers/auth/clear-user-session.js')
vi.mock('#server/common/helpers/auth/get-user-session.js')
vi.mock('#server/common/helpers/auth/get-oidc-config.js')
vi.mock('#server/common/helpers/auditing/index.js')

describe('#signOut route', () => {
  const mockOidcConfig = {
    end_session_endpoint: 'https://example-oidc.test/oauth/logout'
  }

  const mockLogger = {
    info: vi.fn()
  }

  const mockToolkit = {
    redirect: vi.fn().mockReturnValue('redirect-result'),
    view: vi.fn().mockReturnValue('view-result')
  }

  beforeEach(() => {
    vi.clearAllMocks()

    mockToolkit.redirect.mockReturnValue('redirect-result')
    mockToolkit.view.mockReturnValue('view-result')
    vi.mocked(getOidcConfig).mockResolvedValue(mockOidcConfig)
    vi.mocked(clearUserSession).mockResolvedValue()
    vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
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

  test('Should redirect to home if there is no user session', async () => {
    vi.mocked(getUserSession).mockResolvedValue(null)

    const result = await signOutRoute.handler(asRequest({}), mockToolkit)

    expect(mockToolkit.redirect).toHaveBeenCalledWith('/')
    expect(result).toBe('redirect-result')
    expect(clearUserSession).not.toHaveBeenCalled()
    expect(getOidcConfig).not.toHaveBeenCalled()
  })

  test('Should clear session and render sign-out view for authenticated user', async () => {
    const mockRequest = {
      logger: mockLogger,
      auth: {
        isAuthenticated: true
      }
    }

    const result = await signOutRoute.handler(
      asRequest(mockRequest),
      mockToolkit
    )

    expect(clearUserSession).toHaveBeenCalledWith(mockRequest)
    expect(getOidcConfig).toHaveBeenCalledTimes(1)

    const expectedParams = new URLSearchParams()
    expectedParams.set('logout_hint', mockUserSession.email)
    expectedParams.set(
      'post_logout_redirect_uri',
      `${config.get('appBaseUrl')}/`
    )
    const expectedLogoutUrl = `${mockOidcConfig.end_session_endpoint}?${expectedParams.toString()}`
    expect(mockToolkit.view).toHaveBeenCalledWith(
      'routes/auth/sign-out/index',
      {
        pageTitle: 'Signing out',
        logoutUrl: expectedLogoutUrl
      }
    )
    expect(result).toBe('view-result')
  })

  test('Should construct logout URL with correct parameters', async () => {
    const mockRequest = {
      logger: mockLogger,
      auth: {
        isAuthenticated: true
      }
    }

    await signOutRoute.handler(asRequest(mockRequest), mockToolkit)

    const expectedParams = new URLSearchParams()
    expectedParams.set('logout_hint', mockUserSession.email)
    expectedParams.set(
      'post_logout_redirect_uri',
      `${config.get('appBaseUrl')}/`
    )
    const expectedUrl = `${mockOidcConfig.end_session_endpoint}?${expectedParams.toString()}`
    expect(mockToolkit.view).toHaveBeenCalledWith(
      'routes/auth/sign-out/index',
      {
        pageTitle: 'Signing out',
        logoutUrl: expectedUrl
      }
    )
  })

  test('Should prefer loginHint over email for logout_hint', async () => {
    vi.mocked(getUserSession).mockResolvedValue({
      ...mockUserSession,
      loginHint: 'hint@example.test'
    })

    const mockRequest = {
      logger: mockLogger,
      auth: { isAuthenticated: true }
    }

    await signOutRoute.handler(asRequest(mockRequest), mockToolkit)

    expect(mockToolkit.view).toHaveBeenCalledWith(
      'routes/auth/sign-out/index',
      expect.objectContaining({
        logoutUrl: expect.stringContaining('logout_hint=hint%40example.test')
      })
    )
  })

  test('Should omit logout_hint when neither loginHint nor email available', async () => {
    vi.mocked(getUserSession).mockResolvedValue({
      ...mockUserSession,
      loginHint: undefined,
      email: undefined
    })

    const mockRequest = {
      logger: mockLogger,
      auth: { isAuthenticated: true }
    }

    await signOutRoute.handler(asRequest(mockRequest), mockToolkit)

    expect(mockToolkit.view).toHaveBeenCalledWith(
      'routes/auth/sign-out/index',
      expect.objectContaining({
        logoutUrl: expect.not.stringContaining('logout_hint')
      })
    )
  })

  test('Should handle different end session endpoints', async () => {
    const testEndpoints = [
      'https://example-oidc-1.test/oauth/logout',
      'https://example-oidc-2.test/oauth/logout',
      'https://example-provider.test/logout'
    ]

    for (const endpoint of testEndpoints) {
      vi.clearAllMocks()
      vi.mocked(getOidcConfig).mockResolvedValue({
        end_session_endpoint: endpoint
      })
      vi.mocked(clearUserSession).mockResolvedValue()
      mockToolkit.view.mockReturnValue('view-result')

      const mockRequest = {
        logger: mockLogger,
        auth: {
          isAuthenticated: true
        }
      }

      await signOutRoute.handler(asRequest(mockRequest), mockToolkit)

      const expectedParams = new URLSearchParams()
      expectedParams.set('logout_hint', mockUserSession.email)
      expectedParams.set(
        'post_logout_redirect_uri',
        `${config.get('appBaseUrl')}/`
      )
      const expectedUrl = `${endpoint}?${expectedParams.toString()}`
      expect(mockToolkit.view).toHaveBeenCalledWith(
        'routes/auth/sign-out/index',
        {
          pageTitle: 'Signing out',
          logoutUrl: expectedUrl
        }
      )
    }
  })

  test('Should handle getOidcConfig errors', async () => {
    const error = new Error('Failed to get OIDC config')
    vi.mocked(getOidcConfig).mockRejectedValue(error)

    await expect(
      signOutRoute.handler(asRequest({}), mockToolkit)
    ).rejects.toThrow('Failed to get OIDC config')

    expect(clearUserSession).not.toHaveBeenCalledWith()
    expect(mockToolkit.view).not.toHaveBeenCalled()
  })

  test('Should handle clearUserSession errors', async () => {
    const error = new Error('Failed to clear session')
    vi.mocked(clearUserSession).mockImplementation(() => {
      throw error
    })

    const mockRequest = {
      logger: mockLogger,
      auth: {
        isAuthenticated: true
      }
    }

    await expect(
      signOutRoute.handler(asRequest(mockRequest), mockToolkit)
    ).rejects.toThrow('Failed to clear session')

    expect(mockToolkit.view).not.toHaveBeenCalled()
  })

  test('Should call functions in correct order for authenticated user', async () => {
    const callOrder = []

    vi.mocked(clearUserSession).mockImplementation(async () => {
      callOrder.push('clearUserSession')
    })

    vi.mocked(getOidcConfig).mockImplementation(async () => {
      callOrder.push('getOidcConfig')
      return mockOidcConfig
    })

    mockToolkit.view.mockImplementation(() => {
      callOrder.push('view')
      return 'view-result'
    })

    const mockRequest = {
      logger: mockLogger,
      auth: {
        isAuthenticated: true
      }
    }

    await signOutRoute.handler(asRequest(mockRequest), mockToolkit)

    expect(callOrder).toEqual(['getOidcConfig', 'clearUserSession', 'view'])
  })

  test('Should handle missing end_session_endpoint in OIDC config', async () => {
    vi.mocked(getOidcConfig).mockResolvedValue({})

    const mockRequest = {
      logger: mockLogger,
      auth: {
        isAuthenticated: true
      }
    }

    await signOutRoute.handler(asRequest(mockRequest), mockToolkit)

    const expectedParams = new URLSearchParams()
    expectedParams.set('logout_hint', mockUserSession.email)
    expectedParams.set(
      'post_logout_redirect_uri',
      `${config.get('appBaseUrl')}/`
    )
    const expectedUrl = `undefined?${expectedParams.toString()}`
    expect(mockToolkit.view).toHaveBeenCalledWith(
      'routes/auth/sign-out/index',
      {
        pageTitle: 'Signing out',
        logoutUrl: expectedUrl
      }
    )
  })

  test('Should call auditSignOut with user session', async () => {
    const mockRequest = {
      logger: mockLogger,
      auth: {
        isAuthenticated: true
      }
    }

    await signOutRoute.handler(asRequest(mockRequest), mockToolkit)

    expect(auditSignOut).toHaveBeenCalledWith(mockUserSession)
  })

  test('Should not call auditSignOut when no user session', async () => {
    vi.mocked(getUserSession).mockResolvedValue(null)

    await signOutRoute.handler(asRequest({}), mockToolkit)

    expect(auditSignOut).not.toHaveBeenCalled()
  })

  test('Should log sign-out with user details', async () => {
    const mockRequest = {
      logger: mockLogger,
      auth: {
        isAuthenticated: true
      }
    }

    await signOutRoute.handler(asRequest(mockRequest), mockToolkit)

    expect(mockLogger.info).toHaveBeenCalledWith({
      message: 'User signed out',
      event: {
        action: 'sign_out',
        reason: `userId=${mockUserSession.userId} displayName=${mockUserSession.displayName}`
      }
    })
  })
})
