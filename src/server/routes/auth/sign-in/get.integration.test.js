// TODO GET an check metric recorded
import { beforeEach, vi } from 'vitest'
import { createServer } from '#server/server.js'
import { statusCodes } from '#server/common/constants/status-codes.js'
import {
  createMockOidcServer,
  mockOidcResponse
} from '#server/common/test-helpers/mock-oidc.js'

const mockSignInAttemptedMetric = vi.fn()

vi.mock('#server/common/helpers/metrics/index.js', () => ({
  metrics: {
    signInAttempted: () => mockSignInAttemptedMetric()
  }
}))

describe('GET /sign-in', () => {
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
    // Ensure any stubbed globals are reset after each test
    if (typeof vi.unstubAllGlobals === 'function') {
      vi.unstubAllGlobals()
    }
  })

  describe('on access', () => {
    let response

    beforeEach(async () => {
      response = await server.inject({
        method: 'GET',
        url: '/auth/sign-in'
      })
    })

    it('redirects to Entra ID', async () => {
      expect(response.statusCode).toBe(statusCodes.redirect)
      expect(response.headers['location']).toContain(
        mockOidcResponse.authorization_endpoint
      )
    })

    it('records sign in attempt metric', () => {
      expect(mockSignInAttemptedMetric).toHaveBeenCalledTimes(1)
    })
  })
})
