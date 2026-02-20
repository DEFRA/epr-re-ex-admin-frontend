import { vi, beforeEach, afterEach, describe, test, expect } from 'vitest'

import { wasteBalanceAvailability } from './index.js'

describe('#waste-balance-availability routes plugin', () => {
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
    expect(wasteBalanceAvailability.plugin.name).toBe(
      'waste-balance-availability'
    )
  })

  test('Should register routes', () => {
    wasteBalanceAvailability.plugin.register(mockServer)

    expect(mockServer.route).toHaveBeenCalledTimes(1)
    expect(mockServer.route).toHaveBeenCalledWith(expect.any(Array))
  })

  test('Should register GET and POST routes', () => {
    wasteBalanceAvailability.plugin.register(mockServer)

    const registeredRoutes = mockServer.route.mock.calls[0][0]

    expect(registeredRoutes).toHaveLength(2)
    expect(registeredRoutes[0]).toMatchObject({
      method: 'GET',
      path: '/waste-balance-availability'
    })
    expect(registeredRoutes[1]).toMatchObject({
      method: 'POST',
      path: '/waste-balance-availability'
    })
  })

  test('Should set page title for GET route', () => {
    wasteBalanceAvailability.plugin.register(mockServer)

    const registeredRoutes = mockServer.route.mock.calls[0][0]
    const getRoute = registeredRoutes[0]

    expect(getRoute.options.app.pageTitle).toBe('Waste balance availability')
  })

  test('Should register route objects with handlers', () => {
    wasteBalanceAvailability.plugin.register(mockServer)

    const registeredRoutes = mockServer.route.mock.calls[0][0]

    expect(registeredRoutes[0]).toHaveProperty('handler')
    expect(registeredRoutes[1]).toHaveProperty('handler')
  })

  test('Should maintain plugin structure', () => {
    expect(wasteBalanceAvailability).toHaveProperty('plugin')
    expect(wasteBalanceAvailability.plugin).toHaveProperty('name')
    expect(wasteBalanceAvailability.plugin).toHaveProperty('register')
    expect(typeof wasteBalanceAvailability.plugin.register).toBe('function')
  })
})
