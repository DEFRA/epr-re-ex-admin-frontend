import { vi, beforeEach, afterEach, describe, test, expect } from 'vitest'

import { linkedOrganisations } from './index.js'

describe('#linked-organisations routes plugin', () => {
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
    expect(linkedOrganisations.plugin.name).toBe('linked-organisations')
  })

  test('Should register routes', () => {
    linkedOrganisations.plugin.register(mockServer)

    expect(mockServer.route).toHaveBeenCalledTimes(1)
    expect(mockServer.route).toHaveBeenCalledWith(expect.any(Array))
  })

  test('Should register GET, POST search and POST download routes', () => {
    linkedOrganisations.plugin.register(mockServer)

    const registeredRoutes = mockServer.route.mock.calls[0][0]

    expect(registeredRoutes).toHaveLength(3)
    expect(registeredRoutes[0]).toMatchObject({
      method: 'GET',
      path: '/linked-organisations'
    })
    expect(registeredRoutes[1]).toMatchObject({
      method: 'POST',
      path: '/linked-organisations'
    })
    expect(registeredRoutes[2]).toMatchObject({
      method: 'POST',
      path: '/linked-organisations/download'
    })
  })

  test('Should set page title for GET and POST search routes', () => {
    linkedOrganisations.plugin.register(mockServer)

    const registeredRoutes = mockServer.route.mock.calls[0][0]

    expect(registeredRoutes[0].options.app.pageTitle).toBe(
      'Linked organisations'
    )
    expect(registeredRoutes[1].options.app.pageTitle).toBe(
      'Linked organisations'
    )
  })

  test('Should register route objects with handlers', () => {
    linkedOrganisations.plugin.register(mockServer)

    const registeredRoutes = mockServer.route.mock.calls[0][0]

    expect(registeredRoutes[0]).toHaveProperty('handler')
    expect(registeredRoutes[1]).toHaveProperty('handler')
    expect(registeredRoutes[2]).toHaveProperty('handler')
  })

  test('Should maintain plugin structure', () => {
    expect(linkedOrganisations).toHaveProperty('plugin')
    expect(linkedOrganisations.plugin).toHaveProperty('name')
    expect(linkedOrganisations.plugin).toHaveProperty('register')
    expect(typeof linkedOrganisations.plugin.register).toBe('function')
  })
})
