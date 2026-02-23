import { vi, beforeEach, afterEach, describe, test, expect } from 'vitest'
import { prnTonnage } from './index.js'

describe('#prn-tonnage routes plugin', () => {
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
    expect(prnTonnage.plugin.name).toBe('prn-tonnage')
  })

  test('Should register routes', () => {
    prnTonnage.plugin.register(mockServer)

    expect(mockServer.route).toHaveBeenCalledTimes(1)
    expect(mockServer.route).toHaveBeenCalledWith(expect.any(Array))
  })

  test('Should register GET and POST routes', () => {
    prnTonnage.plugin.register(mockServer)

    const registeredRoutes = mockServer.route.mock.calls[0][0]

    expect(registeredRoutes).toHaveLength(2)
    expect(registeredRoutes[0]).toMatchObject({
      method: 'GET',
      path: '/prn-tonnage'
    })
    expect(registeredRoutes[1]).toMatchObject({
      method: 'POST',
      path: '/prn-tonnage'
    })
  })

  test('Should set page title for GET route', () => {
    prnTonnage.plugin.register(mockServer)

    const registeredRoutes = mockServer.route.mock.calls[0][0]
    const getRoute = registeredRoutes[0]

    expect(getRoute.options.app.pageTitle).toBe('PRN tonnage')
  })

  test('Should register route objects with handlers', () => {
    prnTonnage.plugin.register(mockServer)

    const registeredRoutes = mockServer.route.mock.calls[0][0]

    expect(registeredRoutes[0]).toHaveProperty('handler')
    expect(registeredRoutes[1]).toHaveProperty('handler')
  })

  test('Should maintain plugin structure', () => {
    expect(prnTonnage).toHaveProperty('plugin')
    expect(prnTonnage.plugin).toHaveProperty('name')
    expect(prnTonnage.plugin).toHaveProperty('register')
    expect(typeof prnTonnage.plugin.register).toBe('function')
  })
})
