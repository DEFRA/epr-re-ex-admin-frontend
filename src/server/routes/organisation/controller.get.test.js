import { vi } from 'vitest'
import { createServer } from '#server/server.js'
import { config } from '#config/config.js'
import { statusCodes } from '#server/common/constants/status-codes.js'
import { mockUserSession } from '#server/common/test-helpers/fixtures.js'
import { getUserSession } from '#server/common/helpers/auth/get-user-session.js'
import { createMockOidcServer } from '#server/common/test-helpers/mock-oidc.js'
import {
  http,
  server as mswServer,
  HttpResponse
} from '../../../../.vite/setup-msw.js'

vi.mock('#server/common/helpers/auth/get-user-session.js', () => ({
  getUserSession: vi.fn().mockReturnValue(null)
}))

describe('organisation GET controller', () => {
  const originalBackendUrl = config.get('eprBackendUrl')
  const backendUrl = 'http://mock-backend'
  let server

  beforeAll(async () => {
    config.set('eprBackendUrl', backendUrl)
    createMockOidcServer()
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    config.set('eprBackendUrl', originalBackendUrl)
    await server.stop({ timeout: 0 })
  })

  afterEach(() => {
    vi.clearAllMocks()
    // Ensure any stubbed globals are reset after each test
    if (typeof vi.unstubAllGlobals === 'function') {
      vi.unstubAllGlobals()
    }
  })

  describe('When user is unauthenticated', () => {
    test('Should return unauthorised status code and unauthorised view', async () => {
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/organisations/123'
      })

      expect(statusCode).toBe(statusCodes.unauthorised)
      expect(result).toEqual(expect.stringContaining('Unauthorised'))
    })
  })

  describe('When user is authenticated', () => {
    beforeAll(() => {
      getUserSession.mockReturnValue(mockUserSession)
    })

    test('Should return OK and render organisation details ', async () => {
      const orgId = 'org-123'
      const mockOrganisation = {
        id: orgId,
        orgId: 12345,
        status: 'approved',
        companyDetails: {
          name: 'Test Company <script>alert("xss")</script>',
          registrationNumber: '12345678'
        },
        // Include characters that need escaping
        notes:
          'Line separator: \u2028 Paragraph separator: \u2029 HTML comment: -->'
      }

      const getOrganisationHandler = http.get(
        `${backendUrl}/v1/organisations/${orgId}`,
        () => {
          return HttpResponse.json(mockOrganisation)
        }
      )

      mswServer.use(getOrganisationHandler)

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: `/organisations/${orgId}`,
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        }
      })

      expect(statusCode).toBe(statusCodes.ok)
      expect(result).toContain('Organisation')

      // Verify breadcrumb is included
      expect(result).toContain('Organisations')
    })

    test('Should show 500 error page when backend fetch throws', async () => {
      getUserSession.mockReturnValue(mockUserSession)

      const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'))

      vi.stubGlobal('fetch', fetchMock)

      const { result } = await server.inject({
        method: 'GET',
        url: '/organisations/org-1',
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        }
      })

      expect(result).toEqual(
        expect.stringContaining('Sorry, there is a problem with the service')
      )
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })
  })
})
