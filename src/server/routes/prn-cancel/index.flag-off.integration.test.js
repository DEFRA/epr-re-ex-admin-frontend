import { vi } from 'vitest'
import { mockUserSession } from '#server/common/test-helpers/fixtures.js'
import { getUserSession } from '#server/common/helpers/auth/get-user-session.js'
import { createMockOidcServer } from '#server/common/test-helpers/mock-oidc.js'
import { createServer } from '#server/server.js'

vi.mock('#server/common/helpers/auth/get-user-session.js', () => ({
  getUserSession: vi.fn().mockReturnValue(null)
}))

vi.mock('#server/common/helpers/feature-flags.js', () => ({
  FEATURE_FLAGS: { prnAdminCancellation: false }
}))

/**
 * PAE-1847: previously only the Cancel link was withheld when the flag was
 * off — the confirm and POST routes stayed registered, so a cancellation
 * could still succeed via a direct URL. `server/router.js` now registers
 * `prnCancel` conditionally on the flag, so with it off these routes must not
 * exist at all.
 */
describe('prn-cancel routes, feature flag off', () => {
  const prnId = 'aaa111bbb222ccc333ddd4444'
  const confirmUrl = `/prn-activity/${prnId}/cancel/confirm`
  const postUrl = `/prn-activity/${prnId}/cancel`

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

  test('the confirmation page is not served', async () => {
    vi.mocked(getUserSession).mockResolvedValue(mockUserSession)

    const { statusCode } = await server.inject({
      method: 'GET',
      url: `${confirmUrl}?prnNumber=ER26000123`,
      auth: { strategy: 'session', credentials: mockUserSession }
    })

    expect(statusCode).toBe(404)
  })

  test('the cancel POST route is not served', async () => {
    vi.mocked(getUserSession).mockResolvedValue(mockUserSession)

    const { statusCode } = await server.inject({
      method: 'POST',
      url: postUrl,
      auth: { strategy: 'session', credentials: mockUserSession },
      payload: {}
    })

    expect(statusCode).toBe(404)
  })
})
