import { vi, describe, test, expect, beforeEach } from 'vitest'
import { reportSubmissions } from './index.js'

describe('#report-submissions routes plugin', () => {
  const mockServer = {
    route: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('has correct plugin name', () => {
    expect(reportSubmissions.plugin.name).toBe('report-submissions')
  })

  test('has a register function', () => {
    expect(typeof reportSubmissions.plugin.register).toBe('function')
  })

  test('registers two routes', () => {
    reportSubmissions.plugin.register(mockServer)

    const routes = mockServer.route.mock.calls[0][0]
    expect(routes).toHaveLength(2)
  })

  test('registers GET /report-submissions', () => {
    reportSubmissions.plugin.register(mockServer)

    const routes = mockServer.route.mock.calls[0][0]
    expect(routes[0]).toMatchObject({
      method: 'GET',
      path: '/report-submissions'
    })
  })

  test('registers POST /report-submissions', () => {
    reportSubmissions.plugin.register(mockServer)

    const routes = mockServer.route.mock.calls[0][0]
    expect(routes[1]).toMatchObject({
      method: 'POST',
      path: '/report-submissions'
    })
  })

  test('GET route has a handler', () => {
    reportSubmissions.plugin.register(mockServer)

    const routes = mockServer.route.mock.calls[0][0]
    expect(routes[0]).toHaveProperty('handler')
  })

  test('POST route has a handler', () => {
    reportSubmissions.plugin.register(mockServer)

    const routes = mockServer.route.mock.calls[0][0]
    expect(routes[1]).toHaveProperty('handler')
  })
})
