import { vi, beforeEach, afterEach, describe, test, expect } from 'vitest'
import Boom from '@hapi/boom'

import { rbacPlugin } from './rbac-plugin.js'
import { getUserSession } from '#server/common/helpers/auth/get-user-session.js'

vi.mock('#server/common/helpers/auth/get-user-session.js')

describe('#rbacPlugin', () => {
  let onPreHandler
  const mockH = { continue: Symbol('continue') }

  const mockServer = {
    ext: vi.fn((event, handler) => {
      if (event === 'onPreHandler') {
        onPreHandler = handler
      }
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    rbacPlugin.plugin.register(mockServer)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  test('Should have correct plugin name', () => {
    expect(rbacPlugin.plugin.name).toBe('rbac-plugin')
  })

  test('Should register an onPreHandler extension', () => {
    expect(mockServer.ext).toHaveBeenCalledWith(
      'onPreHandler',
      expect.any(Function)
    )
  })

  test('Should skip routes with auth set to false', async () => {
    const request = {
      route: { settings: { auth: false } },
      path: '/health'
    }

    const result = await onPreHandler(request, mockH)

    expect(result).toBe(mockH.continue)
    expect(getUserSession).not.toHaveBeenCalled()
  })

  test('Should skip auth routes', async () => {
    const request = {
      route: { settings: { auth: { strategy: 'entra-id' } } },
      path: '/auth/callback'
    }

    const result = await onPreHandler(request, mockH)

    expect(result).toBe(mockH.continue)
    expect(getUserSession).not.toHaveBeenCalled()
  })

  test('Should skip auth sign-out route', async () => {
    const request = {
      route: { settings: { auth: { strategy: 'session' } } },
      path: '/auth/sign-out'
    }

    const result = await onPreHandler(request, mockH)

    expect(result).toBe(mockH.continue)
    expect(getUserSession).not.toHaveBeenCalled()
  })

  test('Should allow users with service_maintainer role', async () => {
    getUserSession.mockResolvedValue({
      roles: ['service_maintainer']
    })

    const request = {
      route: { settings: { auth: { strategy: 'session' } } },
      path: '/organisations'
    }

    const result = await onPreHandler(request, mockH)

    expect(result).toBe(mockH.continue)
  })

  test('Should allow users with service_maintainer among multiple roles', async () => {
    getUserSession.mockResolvedValue({
      roles: ['some_other_role', 'service_maintainer']
    })

    const request = {
      route: { settings: { auth: { strategy: 'session' } } },
      path: '/organisations'
    }

    const result = await onPreHandler(request, mockH)

    expect(result).toBe(mockH.continue)
  })

  test('Should throw 403 for users without service_maintainer role', async () => {
    getUserSession.mockResolvedValue({
      roles: ['some_other_role']
    })

    const request = {
      route: { settings: { auth: { strategy: 'session' } } },
      path: '/organisations'
    }

    await expect(onPreHandler(request, mockH)).rejects.toThrow(
      Boom.forbidden()
    )
  })

  test('Should throw 403 for users with empty roles array', async () => {
    getUserSession.mockResolvedValue({
      roles: []
    })

    const request = {
      route: { settings: { auth: { strategy: 'session' } } },
      path: '/organisations'
    }

    await expect(onPreHandler(request, mockH)).rejects.toThrow(
      Boom.forbidden()
    )
  })

  test('Should throw 403 for users with no roles property', async () => {
    getUserSession.mockResolvedValue({})

    const request = {
      route: { settings: { auth: { strategy: 'session' } } },
      path: '/organisations'
    }

    await expect(onPreHandler(request, mockH)).rejects.toThrow(
      Boom.forbidden()
    )
  })

  test('Should throw 403 when session is null', async () => {
    getUserSession.mockResolvedValue(null)

    const request = {
      route: { settings: { auth: { strategy: 'session' } } },
      path: '/organisations'
    }

    await expect(onPreHandler(request, mockH)).rejects.toThrow(
      Boom.forbidden()
    )
  })
})
