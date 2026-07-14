import { wasteBalanceReport } from './index.js'

describe('#waste-balance-report routes plugin', () => {
  const mockServer = {
    route: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('has the correct plugin name', () => {
    expect(wasteBalanceReport.plugin.name).toBe('waste-balance-report')
  })

  it('registers GET /waste-balance-report with a handler', () => {
    wasteBalanceReport.plugin.register(mockServer)

    const routes = mockServer.route.mock.calls[0][0]
    expect(routes).toHaveLength(2)
    expect(routes[0]).toMatchObject({
      method: 'GET',
      path: '/waste-balance-report'
    })
    expect(routes[0]).toHaveProperty('handler')
  })

  it('registers POST /waste-balance-report with a handler', () => {
    wasteBalanceReport.plugin.register(mockServer)

    const routes = mockServer.route.mock.calls[0][0]
    expect(routes[1]).toMatchObject({
      method: 'POST',
      path: '/waste-balance-report'
    })
    expect(routes[1]).toHaveProperty('handler')
  })
})
