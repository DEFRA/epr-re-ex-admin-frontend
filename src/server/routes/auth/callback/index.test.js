import { vi, beforeEach, afterEach, describe, test, expect } from 'vitest'

import callbackRoute from './index.js'
import { createUserSession } from '#server/common/helpers/auth/create-user-session.js'
import { fetchAdminMe } from '#server/common/helpers/auth/fetch-admin-me.js'
import { randomUUID } from 'node:crypto'
import { auditSignIn } from '#server/common/helpers/auditing/index.js'
import { asRequest } from '#server/common/test-helpers/fixtures.js'

/** @import { ResponseToolkit } from '@hapi/hapi' */

vi.mock('#server/common/helpers/auth/create-user-session.js')
vi.mock('#server/common/helpers/auth/fetch-admin-me.js')
vi.mock('#server/common/helpers/auditing/index.js')
vi.mock('node:crypto')

/**
 * Cast a partial mock toolkit to the full `ResponseToolkit` shape.
 * @param {unknown} obj
 * @returns {ResponseToolkit}
 */
const asToolkit = (obj) => /** @type {ResponseToolkit} */ (obj)

const ADMIN_ME_DEFAULT = {
  scopes: ['admin.read', 'admin.write', 'admin.dlq.purge']
}

describe('#callback route', () => {
  const mockToolkit = {
    view: vi.fn().mockReturnValue('unauthorised-view-result'),
    redirect: vi.fn().mockReturnValue('redirect-result')
  }

  const mockLogger = {
    info: vi.fn(),
    error: vi.fn()
  }

  const mockProfile = {
    displayName: 'John Doe',
    email: 'john.doe@example-user.test',
    id: 'user-id-123'
  }

  const mockToken = 'mock-jwt-token'
  const mockRefreshToken = 'mock-refresh-token'
  const mockSessionId =
    /** @type {`${string}-${string}-${string}-${string}-${string}`} */ (
      '00000000-0000-0000-0000-000000000456'
    )

  beforeEach(() => {
    vi.clearAllMocks()

    mockToolkit.view.mockReturnValue('unauthorised-view-result')
    mockToolkit.redirect.mockReturnValue('redirect-result')
    vi.mocked(createUserSession).mockResolvedValue(undefined)
    vi.mocked(fetchAdminMe).mockResolvedValue(ADMIN_ME_DEFAULT)
    vi.mocked(randomUUID).mockReturnValue(mockSessionId)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  test('Should have correct HTTP method', () => {
    expect(callbackRoute.method).toBe('GET')
  })

  test('Should have correct path', () => {
    expect(callbackRoute.path).toBe('/auth/callback')
  })

  test('Should have correct auth configuration', () => {
    expect(callbackRoute.options.auth.strategy).toBe('entra-id')
    expect(callbackRoute.options.auth.mode).toBe('try')
  })

  test('Should have async handler function', () => {
    expect(typeof callbackRoute.handler).toBe('function')
    expect(callbackRoute.handler.constructor.name).toBe('AsyncFunction')
  })

  test('Should return unauthorised view if not authenticated', async () => {
    const mockRequest = {
      logger: mockLogger,
      auth: {
        isAuthenticated: false
      }
    }

    const result = await callbackRoute.handler(
      asRequest(mockRequest),
      asToolkit(mockToolkit)
    )

    expect(mockToolkit.view).toHaveBeenCalledWith('unauthorised')
    expect(result).toBe('unauthorised-view-result')
    expect(createUserSession).not.toHaveBeenCalled()
    expect(randomUUID).not.toHaveBeenCalled()
  })

  describe('User is authenticated', () => {
    it.each([
      { referrer: ['/some-page'], expectedRedirectUrl: '/some-page' },
      { referrer: [], expectedRedirectUrl: '/' }, // no referrer in flash
      { referrer: ['//protocol-relative-page'], expectedRedirectUrl: '/' },
      { referrer: ['http://some-other-domain'], expectedRedirectUrl: '/' },
      { referrer: ['non-relative-page'], expectedRedirectUrl: '/' }
    ])(
      'Should create session and redirect to either flash referrer (when present and safe) or home',
      async ({ referrer, expectedRedirectUrl }) => {
        const mockRequest = {
          logger: mockLogger,
          auth: {
            isAuthenticated: true,
            credentials: {
              profile: mockProfile,
              token: mockToken,
              refreshToken: mockRefreshToken
            }
          },
          yar: {
            flash: vi.fn().mockReturnValue(referrer)
          }
        }

        const result = await callbackRoute.handler(
          asRequest(mockRequest),
          asToolkit(mockToolkit)
        )

        expect(randomUUID).toHaveBeenCalledTimes(1)
        expect(createUserSession).toHaveBeenCalledWith(mockRequest, {
          userId: mockProfile.id,
          email: mockProfile.email,
          sessionId: mockSessionId,
          displayName: mockProfile.displayName,
          isAuthenticated: true,
          scopes: ADMIN_ME_DEFAULT.scopes,
          token: mockToken,
          refreshToken: mockRefreshToken
        })
        expect(mockToolkit.redirect).toHaveBeenCalledWith(expectedRedirectUrl)
        expect(result).toBe('redirect-result')
      }
    )
  })

  test('Should handle missing displayName in profile', async () => {
    const profileWithoutDisplayName = {
      email: 'test@example-user.test',
      id: 'user-id'
    }

    const mockRequest = {
      logger: mockLogger,
      auth: {
        isAuthenticated: true,
        credentials: {
          profile: profileWithoutDisplayName,
          token: mockToken,
          refreshToken: mockRefreshToken
        }
      }
    }

    await callbackRoute.handler(asRequest(mockRequest), asToolkit(mockToolkit))

    expect(createUserSession).toHaveBeenCalledWith(mockRequest, {
      userId: profileWithoutDisplayName.id,
      email: profileWithoutDisplayName.email,
      sessionId: mockSessionId,
      displayName: '',
      isAuthenticated: true,
      scopes: ADMIN_ME_DEFAULT.scopes,
      token: mockToken,
      refreshToken: mockRefreshToken
    })
  })

  test('Should handle empty profile object', async () => {
    const mockRequest = {
      logger: mockLogger,
      auth: {
        isAuthenticated: true,
        credentials: {
          profile: {},
          token: mockToken,
          refreshToken: mockRefreshToken
        }
      }
    }

    await callbackRoute.handler(asRequest(mockRequest), asToolkit(mockToolkit))

    expect(createUserSession).toHaveBeenCalledWith(mockRequest, {
      sessionId: mockSessionId,
      displayName: '',
      isAuthenticated: true,
      scopes: ADMIN_ME_DEFAULT.scopes,
      token: mockToken,
      refreshToken: mockRefreshToken
    })
  })

  test('Should generate unique session ID for each request', async () => {
    const sessionIds =
      /** @type {Array<`${string}-${string}-${string}-${string}-${string}`>} */ ([
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000003'
      ])
    vi.mocked(randomUUID)
      .mockReturnValueOnce(sessionIds[0])
      .mockReturnValueOnce(sessionIds[1])
      .mockReturnValueOnce(sessionIds[2])

    const mockRequest = {
      logger: mockLogger,
      auth: {
        isAuthenticated: true,
        credentials: {
          profile: mockProfile,
          token: mockToken,
          refreshToken: mockRefreshToken
        }
      }
    }

    for (let i = 0; i < 3; i++) {
      await callbackRoute.handler(
        asRequest(mockRequest),
        asToolkit(mockToolkit)
      )

      expect(createUserSession).toHaveBeenNthCalledWith(
        i + 1,
        mockRequest,
        expect.objectContaining({
          sessionId: sessionIds[i]
        })
      )
    }

    expect(randomUUID).toHaveBeenCalledTimes(3)
  })

  test('Should handle createUserSession errors', async () => {
    const error = new Error('Failed to create session')
    vi.mocked(createUserSession).mockRejectedValue(error)

    const mockRequest = {
      logger: mockLogger,
      auth: {
        isAuthenticated: true,
        credentials: {
          profile: mockProfile,
          token: mockToken,
          refreshToken: mockRefreshToken
        }
      }
    }

    await expect(
      callbackRoute.handler(asRequest(mockRequest), asToolkit(mockToolkit))
    ).rejects.toThrow('Failed to create session')

    expect(randomUUID).toHaveBeenCalled()
    expect(mockToolkit.redirect).not.toHaveBeenCalled()
  })

  test('Should handle randomUUID errors', async () => {
    const error = new Error('Failed to generate UUID')
    vi.mocked(randomUUID).mockImplementation(() => {
      throw error
    })

    const mockRequest = {
      logger: mockLogger,
      auth: {
        isAuthenticated: true,
        credentials: {
          profile: mockProfile,
          token: mockToken,
          refreshToken: mockRefreshToken
        }
      }
    }

    await expect(
      callbackRoute.handler(asRequest(mockRequest), asToolkit(mockToolkit))
    ).rejects.toThrow('Failed to generate UUID')

    expect(createUserSession).not.toHaveBeenCalled()
    expect(mockToolkit.redirect).not.toHaveBeenCalled()
  })

  test('Should include all required fields in user session', async () => {
    const mockRequest = {
      logger: mockLogger,
      auth: {
        isAuthenticated: true,
        credentials: {
          profile: mockProfile,
          token: mockToken,
          refreshToken: mockRefreshToken
        }
      }
    }

    await callbackRoute.handler(asRequest(mockRequest), asToolkit(mockToolkit))

    const expectedUserSession = {
      userId: mockProfile.id,
      email: mockProfile.email,
      sessionId: mockSessionId,
      displayName: mockProfile.displayName,
      isAuthenticated: true,
      scopes: ADMIN_ME_DEFAULT.scopes,
      token: mockToken,
      refreshToken: mockRefreshToken
    }

    expect(createUserSession).toHaveBeenCalledWith(
      mockRequest,
      expectedUserSession
    )
  })

  test('Should handle missing credentials', async () => {
    const mockRequest = {
      logger: mockLogger,
      auth: {
        isAuthenticated: true,
        credentials: undefined
      }
    }

    await expect(
      callbackRoute.handler(asRequest(mockRequest), asToolkit(mockToolkit))
    ).rejects.toThrow()
  })

  test('Should handle missing profile in credentials', async () => {
    const mockRequest = {
      logger: mockLogger,
      auth: {
        isAuthenticated: true,
        credentials: {
          token: mockToken
        }
      }
    }

    await expect(
      callbackRoute.handler(asRequest(mockRequest), asToolkit(mockToolkit))
    ).rejects.toThrow()
  })

  test('Should handle missing token in credentials', async () => {
    const mockRequest = {
      logger: mockLogger,
      auth: {
        isAuthenticated: true,
        credentials: {
          profile: mockProfile
        }
      }
    }

    await callbackRoute.handler(asRequest(mockRequest), asToolkit(mockToolkit))

    expect(createUserSession).toHaveBeenCalledWith(
      mockRequest,
      expect.objectContaining({
        token: undefined
      })
    )
  })

  test('Should handle different profile structures', async () => {
    const complexProfile = {
      id: 'user-456',
      name: 'J Smith',
      email: 'jane@example-user.test',
      displayName: 'Jane Smith'
    }

    const mockRequest = {
      logger: mockLogger,
      auth: {
        isAuthenticated: true,
        credentials: {
          profile: complexProfile,
          token: mockToken
        }
      }
    }

    await callbackRoute.handler(asRequest(mockRequest), asToolkit(mockToolkit))

    expect(createUserSession).toHaveBeenCalledWith(mockRequest, {
      userId: complexProfile.id,
      email: complexProfile.email,
      sessionId: mockSessionId,
      displayName: complexProfile.displayName,
      isAuthenticated: true,
      scopes: ADMIN_ME_DEFAULT.scopes,
      token: mockToken,
      refreshToken: undefined
    })
  })

  test('Should call functions in correct order for successful authentication', async () => {
    const callOrder = []

    vi.mocked(fetchAdminMe).mockImplementation(async () => {
      callOrder.push('fetchAdminMe')
      return ADMIN_ME_DEFAULT
    })

    vi.mocked(randomUUID).mockImplementation(() => {
      callOrder.push('randomUUID')
      return mockSessionId
    })

    vi.mocked(createUserSession).mockImplementation(async () => {
      callOrder.push('createUserSession')
    })

    mockToolkit.redirect.mockImplementation(() => {
      callOrder.push('redirect')
      return 'redirect-result'
    })

    const mockRequest = {
      logger: mockLogger,
      auth: {
        isAuthenticated: true,
        credentials: {
          profile: mockProfile,
          token: mockToken
        }
      }
    }

    await callbackRoute.handler(asRequest(mockRequest), asToolkit(mockToolkit))

    expect(callOrder).toEqual([
      'fetchAdminMe',
      'randomUUID',
      'createUserSession',
      'redirect'
    ])
  })

  test('Should log sign-in on successful authentication', async () => {
    const mockRequest = {
      logger: mockLogger,
      auth: {
        isAuthenticated: true,
        credentials: {
          profile: mockProfile,
          token: mockToken,
          refreshToken: mockRefreshToken
        }
      },
      yar: {
        flash: vi.fn().mockReturnValue([])
      }
    }

    await callbackRoute.handler(asRequest(mockRequest), asToolkit(mockToolkit))

    expect(mockLogger.info).toHaveBeenCalledWith({
      message: 'User signed in',
      event: {
        action: 'sign_in',
        reason: `userId=${mockProfile.id} displayName=${mockProfile.displayName}`
      }
    })
    expect(mockLogger.info).toHaveBeenCalledWith({
      message: 'Sign-in complete, redirecting user to /'
    })
  })

  test('Should log redirect to referrer page after sign-in', async () => {
    const mockRequest = {
      logger: mockLogger,
      auth: {
        isAuthenticated: true,
        credentials: {
          profile: mockProfile,
          token: mockToken,
          refreshToken: mockRefreshToken
        }
      },
      yar: {
        flash: vi.fn().mockReturnValue(['/prn-activity'])
      }
    }

    await callbackRoute.handler(asRequest(mockRequest), asToolkit(mockToolkit))

    expect(mockLogger.info).toHaveBeenCalledWith({
      message: 'Sign-in complete, redirecting user to /prn-activity'
    })
  })

  test('Should call auditSignIn with user session on successful authentication', async () => {
    const mockRequest = {
      logger: mockLogger,
      auth: {
        isAuthenticated: true,
        credentials: {
          profile: mockProfile,
          token: mockToken,
          refreshToken: mockRefreshToken
        }
      },
      yar: {
        flash: vi.fn().mockReturnValue([])
      }
    }

    await callbackRoute.handler(asRequest(mockRequest), asToolkit(mockToolkit))

    expect(auditSignIn).toHaveBeenCalledWith({
      sessionId: mockSessionId,
      userId: mockProfile.id,
      displayName: mockProfile.displayName,
      email: mockProfile.email,
      isAuthenticated: true,
      scopes: ADMIN_ME_DEFAULT.scopes,
      token: mockToken,
      refreshToken: mockRefreshToken
    })
  })

  test('Should not call auditSignIn when authentication fails', async () => {
    const mockRequest = {
      logger: mockLogger,
      auth: {
        isAuthenticated: false
      }
    }

    await callbackRoute.handler(asRequest(mockRequest), asToolkit(mockToolkit))

    expect(auditSignIn).not.toHaveBeenCalled()
  })

  test('Should include loginHint in user session when present in profile', async () => {
    const mockRequest = {
      logger: mockLogger,
      auth: {
        isAuthenticated: true,
        credentials: {
          profile: { ...mockProfile, loginHint: 'user@example.test' },
          token: mockToken,
          refreshToken: mockRefreshToken
        }
      },
      yar: {
        flash: vi.fn().mockReturnValue([])
      }
    }

    await callbackRoute.handler(asRequest(mockRequest), asToolkit(mockToolkit))

    expect(createUserSession).toHaveBeenCalledWith(
      mockRequest,
      expect.objectContaining({
        loginHint: 'user@example.test'
      })
    )
  })

  describe('Admin role resolution', () => {
    test('Returns the unauthorised view when /v1/admin/me returns 403 (no admin tier)', async () => {
      const error = Object.assign(
        new Error('GET /v1/admin/me failed: 403 Forbidden'),
        { statusCode: 403 }
      )
      vi.mocked(fetchAdminMe).mockRejectedValue(error)

      const mockRequest = {
        logger: mockLogger,
        auth: {
          isAuthenticated: true,
          credentials: {
            profile: mockProfile,
            token: mockToken,
            refreshToken: mockRefreshToken
          }
        }
      }

      const result = await callbackRoute.handler(
        asRequest(mockRequest),
        asToolkit(mockToolkit)
      )

      expect(mockToolkit.view).toHaveBeenCalledWith('unauthorised')
      expect(result).toBe('unauthorised-view-result')
      expect(createUserSession).not.toHaveBeenCalled()
    })

    test('Re-throws non-403 errors from /v1/admin/me so the platform sees the failure', async () => {
      const error = Object.assign(
        new Error('GET /v1/admin/me failed: 500 Internal Server Error'),
        { statusCode: 500 }
      )
      vi.mocked(fetchAdminMe).mockRejectedValue(error)

      const mockRequest = {
        logger: mockLogger,
        auth: {
          isAuthenticated: true,
          credentials: {
            profile: mockProfile,
            token: mockToken,
            refreshToken: mockRefreshToken
          }
        }
      }

      await expect(
        callbackRoute.handler(asRequest(mockRequest), asToolkit(mockToolkit))
      ).rejects.toThrow('GET /v1/admin/me failed: 500')

      expect(createUserSession).not.toHaveBeenCalled()
    })

    test('Calls /v1/admin/me with the Bell access token', async () => {
      const mockRequest = {
        logger: mockLogger,
        auth: {
          isAuthenticated: true,
          credentials: {
            profile: mockProfile,
            token: mockToken,
            refreshToken: mockRefreshToken
          }
        },
        yar: { flash: vi.fn().mockReturnValue([]) }
      }

      await callbackRoute.handler(
        asRequest(mockRequest),
        asToolkit(mockToolkit)
      )

      expect(fetchAdminMe).toHaveBeenCalledWith(mockToken)
    })
  })

  test('Should log error on sign-in failure', async () => {
    const mockRequest = {
      logger: mockLogger,
      auth: {
        isAuthenticated: false,
        error: new Error('Auth failed')
      }
    }

    await callbackRoute.handler(asRequest(mockRequest), asToolkit(mockToolkit))

    expect(mockLogger.error).toHaveBeenCalledWith({
      message: 'Sign-in failed'
    })
  })
})
