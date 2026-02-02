import { vi, beforeEach, afterEach, describe, test, expect } from 'vitest'

import { tonnageMonitoring } from './index.js'

describe('#tonnage-monitoring routes plugin', () => {
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
    expect(tonnageMonitoring.plugin.name).toBe('tonnage-monitoring')
  })

  test('Should register routes', () => {
    tonnageMonitoring.plugin.register(mockServer)

    expect(mockServer.route).toHaveBeenCalledTimes(1)
    expect(mockServer.route).toHaveBeenCalledWith(expect.any(Array))
  })

  test('Should register GET and POST routes', () => {
    tonnageMonitoring.plugin.register(mockServer)

    const registeredRoutes = mockServer.route.mock.calls[0][0]

    expect(registeredRoutes).toHaveLength(2)
    expect(registeredRoutes[0]).toMatchObject({
      method: 'GET',
      path: '/tonnage-monitoring'
    })
    expect(registeredRoutes[1]).toMatchObject({
      method: 'POST',
      path: '/tonnage-monitoring'
    })
  })

  test('Should set page title for GET route', () => {
    tonnageMonitoring.plugin.register(mockServer)

    const registeredRoutes = mockServer.route.mock.calls[0][0]
    const getRoute = registeredRoutes[0]

    expect(getRoute.options.app.pageTitle).toBe('Tonnage monitoring')
  })

  test('Should register route objects with handlers', () => {
    tonnageMonitoring.plugin.register(mockServer)

    const registeredRoutes = mockServer.route.mock.calls[0][0]

    expect(registeredRoutes[0]).toHaveProperty('handler')
    expect(registeredRoutes[1]).toHaveProperty('handler')
  })

  test('Should maintain plugin structure', () => {
    expect(tonnageMonitoring).toHaveProperty('plugin')
    expect(tonnageMonitoring.plugin).toHaveProperty('name')
    expect(tonnageMonitoring.plugin).toHaveProperty('register')
    expect(typeof tonnageMonitoring.plugin.register).toBe('function')
  })
})
