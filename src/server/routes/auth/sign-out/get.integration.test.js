import { beforeEach, vi } from 'vitest'
import { config } from '#config/config.js'
import { createServer } from '#server/server.js'
import { statusCodes } from '#server/common/constants/status-codes.js'
import { mockUserSession } from '#server/common/test-helpers/fixtures.js'
import { getUserSession } from '#server/common/helpers/auth/get-user-session.js'
import {
  createMockOidcServer,
  mockOidcResponse
} from '#server/common/test-helpers/mock-oidc.js'

const mockSignOutSuccessMetric = vi.fn()

vi.mock('#server/common/helpers/metrics/index.js', async (importOriginal) => ({
  metrics: {
    ...(await importOriginal()).metrics,
    signOutSuccess: () => mockSignOutSuccessMetric()
  }
}))

vi.mock('#server/common/helpers/auth/get-user-session.js', () => ({
  getUserSession: vi.fn().mockReturnValue(null)
}))

describe('GET /auth/sign-out', () => {
  let server

  beforeEach(async () => {
    createMockOidcServer()
    server = await createServer()
    await server.initialize()
  })

  afterEach(async () => {
    await server.stop({ timeout: 0 })
    vi.clearAllMocks()
    // Ensure any stubbed globals are reset after each test
    if (typeof vi.unstubAllGlobals === 'function') {
      vi.unstubAllGlobals()
    }
  })

  describe('on sign out', () => {
    let response

    beforeEach(async () => {
      getUserSession.mockReturnValue(mockUserSession)

      response = await server.inject({
        method: 'GET',
        url: '/auth/sign-out',
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        }
      })
    })

    it('redirects to home', async () => {
      // sign out implemented via JS
      const expectedSignOutUrl = `${mockOidcResponse.end_session_endpoint}?post_logout_redirect_uri=${config.get('appBaseUrl')}/`
      expect(response.statusCode).toBe(statusCodes.ok)
      expect(response.result).toContain(
        `<div data-logout-url="${expectedSignOutUrl}" id="sign-out-data"></div>`
      )
      expect(response.result).toContain(
        '<script type="text/javascript" src="/public/javascripts/sign-out'
      )
    })

    it('records sign out success metric', () => {
      expect(mockSignOutSuccessMetric).toHaveBeenCalledTimes(1)
    })
  })
})
