import { vi, beforeEach, afterEach, describe, test, expect } from 'vitest'

import { auth } from './index.js'

describe('#auth routes plugin', () => {
  const mockServer = {
    route: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  test('Should have correct plugin name', () => {
    expect(auth.plugin.name).toBe('auth')
  })

  test('Should register all auth routes', () => {
    auth.plugin.register(mockServer)

    expect(mockServer.route).toHaveBeenCalledTimes(1)
    expect(mockServer.route).toHaveBeenCalledWith(expect.any(Array))
  })

  test('Should include all required routes', () => {
    auth.plugin.register(mockServer)

    const registeredRoutes = mockServer.route.mock.calls[0][0]

    expect(registeredRoutes).toHaveLength(3)
    expect(registeredRoutes[0]).toHaveProperty('path', '/auth/sign-in')
    expect(registeredRoutes[1]).toHaveProperty('path', '/auth/callback')
    expect(registeredRoutes[2]).toHaveProperty('path', '/auth/sign-out')
  })

  test('Should register routes in correct order', () => {
    auth.plugin.register(mockServer)

    const registeredRoutes = mockServer.route.mock.calls[0][0]

    expect(registeredRoutes[0]).toHaveProperty('path', '/auth/sign-in')
    expect(registeredRoutes[1]).toHaveProperty('path', '/auth/callback')
    expect(registeredRoutes[2]).toHaveProperty('path', '/auth/sign-out')
  })

  test('Should handle server.route errors', () => {
    const error = new Error('Failed to register routes')
    mockServer.route.mockImplementation(() => {
      throw error
    })

    expect(() => auth.plugin.register(mockServer)).toThrow(
      'Failed to register routes'
    )
  })

  test('Should maintain plugin structure', () => {
    expect(auth).toHaveProperty('plugin')
    expect(auth.plugin).toHaveProperty('name')
    expect(auth.plugin).toHaveProperty('register')
    expect(typeof auth.plugin.register).toBe('function')
  })

  test('Should register function accepts server parameter', () => {
    expect(auth.plugin.register.length).toBe(1)
  })

  test('Should call server.route with array parameter', () => {
    auth.plugin.register(mockServer)

    expect(mockServer.route).toHaveBeenCalledWith(expect.any(Array))
  })

  test('Should register route objects not functions', () => {
    auth.plugin.register(mockServer)

    const registeredRoutes = mockServer.route.mock.calls[0][0]

    expect(registeredRoutes[0]).toHaveProperty('method')
    expect(registeredRoutes[0]).toHaveProperty('handler')
    expect(registeredRoutes[1]).toHaveProperty('method')
    expect(registeredRoutes[1]).toHaveProperty('handler')
    expect(registeredRoutes[2]).toHaveProperty('method')
    expect(registeredRoutes[2]).toHaveProperty('handler')
  })
})
