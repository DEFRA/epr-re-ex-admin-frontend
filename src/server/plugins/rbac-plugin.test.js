import { vi, describe, test, expect, beforeEach } from 'vitest'
import { ROLES } from '#server/common/constants/roles.js'

vi.mock('#server/common/helpers/auth/get-user-session.js', () => ({
  getUserSession: vi.fn()
}))

describe('rbac-plugin', () => {
  let getUserSession
  let rbacPlugin
  let registeredExtHandler

  beforeEach(async () => {
    vi.clearAllMocks()

    const sessionModule =
      await import('#server/common/helpers/auth/get-user-session.js')
    getUserSession = sessionModule.getUserSession

    const pluginModule = await import('./rbac-plugin.js')
    rbacPlugin = pluginModule.rbacPlugin

    const mockServer = {
      ext: vi.fn((eventName, handler) => {
        registeredExtHandler = handler
      })
    }

    rbacPlugin.plugin.register(mockServer)

    expect(mockServer.ext).toHaveBeenCalledWith(
      'onPostAuth',
      expect.any(Function)
    )
  })

  function createMockRequest(overrides = {}) {
    return {
      route: {
        settings: {
          auth: overrides.auth ?? {},
          app: overrides.app ?? {}
        }
      },
      auth: {
        isAuthenticated: overrides.isAuthenticated ?? true
      },
      ...overrides
    }
  }

  const mockH = { continue: Symbol('continue') }

  test('Should allow access for user with service_maintainer role', async () => {
    getUserSession.mockResolvedValue({
      roles: [ROLES.serviceMaintainer]
    })

    const request = createMockRequest()
    const result = await registeredExtHandler(request, mockH)

    expect(result).toBe(mockH.continue)
  })

  test('Should deny access for user with no roles', async () => {
    getUserSession.mockResolvedValue({ roles: [] })

    const request = createMockRequest()

    await expect(registeredExtHandler(request, mockH)).rejects.toThrow(
      'You do not have the required role to access this page'
    )
  })

  test('Should deny access for user with wrong role', async () => {
    getUserSession.mockResolvedValue({ roles: ['some_other_role'] })

    const request = createMockRequest()

    await expect(registeredExtHandler(request, mockH)).rejects.toThrow(
      'You do not have the required role to access this page'
    )
  })

  test('Should skip role check for routes with auth: false', async () => {
    const request = createMockRequest({ auth: false })
    const result = await registeredExtHandler(request, mockH)

    expect(result).toBe(mockH.continue)
    expect(getUserSession).not.toHaveBeenCalled()
  })

  test('Should skip role check for routes with auth mode try', async () => {
    const request = createMockRequest({
      auth: { mode: 'try' }
    })
    const result = await registeredExtHandler(request, mockH)

    expect(result).toBe(mockH.continue)
    expect(getUserSession).not.toHaveBeenCalled()
  })

  test('Should skip role check for unauthenticated requests', async () => {
    const request = createMockRequest({ isAuthenticated: false })
    const result = await registeredExtHandler(request, mockH)

    expect(result).toBe(mockH.continue)
    expect(getUserSession).not.toHaveBeenCalled()
  })

  test('Should respect custom requiredRoles on route', async () => {
    getUserSession.mockResolvedValue({ roles: ['custom_role'] })

    const request = createMockRequest({
      app: { requiredRoles: ['custom_role'] }
    })

    const result = await registeredExtHandler(request, mockH)
    expect(result).toBe(mockH.continue)
  })

  test('Should allow any authenticated user when requiredRoles is empty', async () => {
    getUserSession.mockResolvedValue({ roles: [] })

    const request = createMockRequest({
      app: { requiredRoles: [] }
    })

    const result = await registeredExtHandler(request, mockH)
    expect(result).toBe(mockH.continue)
  })

  test('Should deny when user has no session', async () => {
    getUserSession.mockResolvedValue(null)

    const request = createMockRequest()

    await expect(registeredExtHandler(request, mockH)).rejects.toThrow(
      'You do not have the required role to access this page'
    )
  })
})
