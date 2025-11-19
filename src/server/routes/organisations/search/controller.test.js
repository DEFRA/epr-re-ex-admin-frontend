import { config } from '#config/config.js'
import { statusCodes } from '#server/common/constants/status-codes.js'
import { getUserSession } from '#server/common/helpers/auth/get-user-session.js'
import { mockUserSession } from '#server/common/test-helpers/fixtures.js'
import { createMockOidcServer } from '#server/common/test-helpers/mock-oidc.js'
import { createServer } from '#server/server.js'
import { vi } from 'vitest'
import {
  http,
  HttpResponse,
  server as mswServer
} from '../../../../.vite/setup-msw.js'

vi.mock('#server/common/helpers/auth/get-user-session.js', () => ({
  getUserSession: vi.fn().mockReturnValue(null)
}))

describe('#organisationsSearchController', () => {
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
        url: '/organisations/search'
      })

      expect(statusCode).toBe(statusCodes.unauthorised)
      expect(result).toContain('Unauthorised')
    })
  })

  describe('When user is authenticated', () => {
    beforeEach(() => {
      getUserSession.mockReturnValue(mockUserSession)
    })

    test('Should return OK status code and search view when no search term provided', async () => {
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/organisations/search'
      })

      expect(statusCode).toBe(statusCodes.ok)
      expect(result).toContain('Search organisations')
    })

    test('Should return OK status code and search view with results when search term provided', async () => {
      const mockOrganisations = [
        {
          id: '1',
          orgId: 'ORG001',
          companyDetails: {
            name: 'Test Organisation',
            registrationNumber: 'REG001'
          },
          status: 'Active'
        }
      ]

      mswServer.use(
        http.get(
          `${backendUrl}/v1/organisations/search`,
          ({ request }) => {
            const url = new URL(request.url)
            const searchTerm = url.searchParams.get('name')
            
            if (searchTerm === 'Test') {
              return HttpResponse.json(mockOrganisations)
            }
            
            return HttpResponse.json([])
          }
        )
      )

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/organisations/search?search=Test'
      })

      expect(statusCode).toBe(statusCodes.ok)
      expect(result).toContain('Search organisations')
      expect(result).toContain('Test Organisation')
      expect(result).toContain('ORG001')
    })

    test('Should handle API errors gracefully', async () => {
      mswServer.use(
        http.get(`${backendUrl}/v1/organisations/search`, () => {
          return HttpResponse.json(
            { message: 'Internal Server Error' },
            { status: 500 }
          )
        })
      )

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/organisations/search?search=Error'
      })

      expect(statusCode).toBe(statusCodes.ok)
      expect(result).toContain('Search organisations')
      expect(result).toContain('No organisations found')
    })
  })
})
