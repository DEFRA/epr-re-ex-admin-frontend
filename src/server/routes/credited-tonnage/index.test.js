import { creditedTonnage } from './index.js'

describe('#credited-tonnage routes plugin', () => {
  const mockServer = {
    route: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('has correct plugin name', () => {
    expect(creditedTonnage.plugin.name).toBe('credited-tonnage')
  })

  test('has a register function', () => {
    expect(typeof creditedTonnage.plugin.register).toBe('function')
  })

  test('registers two routes', () => {
    creditedTonnage.plugin.register(mockServer)

    const routes = mockServer.route.mock.calls[0][0]
    expect(routes).toHaveLength(2)
  })

  test('registers GET /credited-tonnage with a handler', () => {
    creditedTonnage.plugin.register(mockServer)

    const routes = mockServer.route.mock.calls[0][0]
    expect(routes[0]).toMatchObject({
      method: 'GET',
      path: '/credited-tonnage'
    })
    expect(routes[0]).toHaveProperty('handler')
  })

  test('registers POST /credited-tonnage with a handler', () => {
    creditedTonnage.plugin.register(mockServer)

    const routes = mockServer.route.mock.calls[0][0]
    expect(routes[1]).toMatchObject({
      method: 'POST',
      path: '/credited-tonnage'
    })
    expect(routes[1]).toHaveProperty('handler')
  })
})
