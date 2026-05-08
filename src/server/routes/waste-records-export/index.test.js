import { vi, describe, test, expect, beforeEach } from 'vitest'

import { wasteRecordsExport } from './index.js'

describe('#waste-records-export routes plugin', () => {
  const mockServer = {
    route: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('has correct plugin name', () => {
    expect(wasteRecordsExport.plugin.name).toBe('waste-records-export')
  })

  test('has a register function', () => {
    expect(typeof wasteRecordsExport.plugin.register).toBe('function')
  })

  test('registers two routes', () => {
    wasteRecordsExport.plugin.register(mockServer)

    const routes = mockServer.route.mock.calls[0][0]
    expect(routes).toHaveLength(2)
  })

  test('registers GET /waste-records-export', () => {
    wasteRecordsExport.plugin.register(mockServer)

    const routes = mockServer.route.mock.calls[0][0]
    expect(routes[0]).toMatchObject({
      method: 'GET',
      path: '/waste-records-export'
    })
    expect(routes[0]).toHaveProperty('handler')
  })

  test('registers POST /waste-records-export', () => {
    wasteRecordsExport.plugin.register(mockServer)

    const routes = mockServer.route.mock.calls[0][0]
    expect(routes[1]).toMatchObject({
      method: 'POST',
      path: '/waste-records-export'
    })
    expect(routes[1]).toHaveProperty('handler')
  })
})
