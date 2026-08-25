import { vi } from 'vitest'
import * as cheerio from 'cheerio'
import { config } from '#config/config.js'
import { mockUserSession } from '#server/common/test-helpers/fixtures.js'
import { getUserSession } from '#server/common/helpers/auth/get-user-session.js'
import { createMockOidcServer } from '#server/common/test-helpers/mock-oidc.js'
import { http, server as mswServer, HttpResponse } from '#vite/setup-msw.js'
import { createServer } from '#server/server.js'

vi.mock('#server/common/helpers/auth/get-user-session.js', () => ({
  getUserSession: vi.fn().mockReturnValue(null)
}))

vi.mock('#server/common/helpers/feature-flags.js', () => ({
  FEATURE_FLAGS: { prnAdminCancellation: false }
}))

describe('prn-activity Cancel link, feature flag off', () => {
  const backendUrl = config.get('eprBackendUrl')

  let server

  beforeAll(async () => {
    createMockOidcServer()
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('hides the Cancel link and Action column for an accepted PRN with admin.write when the flag is off', async () => {
    vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
    mswServer.use(
      http.get(`${backendUrl}/v1/admin/packaging-recycling-notes`, () =>
        HttpResponse.json({
          items: [
            {
              id: 'prn-id-1',
              prnNumber: 'ER26000123',
              status: 'accepted',
              tonnage: 5,
              regulatorCancellable: true
            }
          ],
          hasMore: false
        })
      )
    )

    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/prn-activity',
      auth: { strategy: 'session', credentials: mockUserSession }
    })

    expect(statusCode).toBe(200)
    const $ = cheerio.load(result)
    expect($('a:contains("Cancel")')).toHaveLength(0)
    expect($('th:contains("Action")')).toHaveLength(0)
  })
})
