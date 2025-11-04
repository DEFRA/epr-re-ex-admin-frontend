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

describe('#organisationGETController', () => {
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
    if (typeof vi.unstubAllGlobals === 'function') {
      vi.unstubAllGlobals()
    }
  })

  describe('When user is unauthenticated', () => {
    test('Should return unauthorised status code and unauthorised view', async () => {
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/organisations/org-1'
      })

      expect(statusCode).toBe(statusCodes.unauthorised)
      expect(result).toEqual(expect.stringContaining('Unauthorised'))
    })
  })

  describe('When user is authenticated', () => {
    beforeAll(() => {
      getUserSession.mockReturnValue(mockUserSession)
    })

    test('Should return OK and render organisation details from backend data', async () => {
      const mockOrganisation = {
        id: 'org-1',
        orgId: 'org-1',
        status: 'ACTIVE',
        companyDetails: {
          name: 'Acme Ltd',
          registrationNumber: '12345678'
        }
      }

      const getOrganisationHandler = http.get(
        `${backendUrl}/v1/organisations/org-1`,
        () => {
          return HttpResponse.json(mockOrganisation)
        }
      )

      mswServer.use(getOrganisationHandler)
      const requestSpy = vi.fn()
      mswServer.events.on('request:start', requestSpy)

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/organisations/org-1',
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        }
      })

      expect(statusCode).toBe(statusCodes.ok)

      // Basic page assertions
      expect(result).not.toEqual(expect.stringContaining('Sign in'))
      expect(result).toEqual(expect.stringContaining('Organisation'))

      // Check for organisation details
      expect(result).toEqual(expect.stringContaining('Acme Ltd'))
      expect(result).toEqual(expect.stringContaining('org-1'))
      expect(result).toEqual(expect.stringContaining('12345678'))
      expect(result).toEqual(expect.stringContaining('ACTIVE'))

      expect(requestSpy).toHaveBeenCalledTimes(1)
    })

    test('Should show 500 error page when backend returns a non-OK response', async () => {
      const getOrganisationHandler = http.get(
        `${backendUrl}/v1/organisations/org-1`,
        () => {
          throw HttpResponse.text('', { status: 500 })
        }
      )

      mswServer.use(getOrganisationHandler)

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
    })
  })
})
