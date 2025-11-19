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

describe('#organisationsController', () => {
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
        url: '/organisations'
      })

      expect(statusCode).toBe(statusCodes.unauthorised)
      expect(result).toEqual(expect.stringContaining('Unauthorised'))
    })
  })

  describe('When user is authenticated', () => {
    beforeAll(() => {
      // Mock an authenticated session
      getUserSession.mockReturnValue(mockUserSession)
    })

    test('Should return OK and render organisations table from backend data', async () => {
      // Mock backend API response for organisations
      const mockOrganisations = [
        {
          id: 'org-1',
          orgId: 'org-1',
          status: 'ACTIVE',
          statusHistory: [
            { status: 'PENDING', updatedAt: '2025-09-01T00:00:00Z' },
            { status: 'ACTIVE', updatedAt: '2025-10-01T00:00:00Z' }
          ],
          companyDetails: {
            name: 'Acme Ltd',
            registrationNumber: '12345678'
          },
          submittedToRegulator: 'regulator-name'
        }
      ]

      const getOrganisationsHandler = http.get(
        `${backendUrl}/v1/organisations`,
        () => {
          return HttpResponse.json(mockOrganisations)
        }
      )

      mswServer.use(getOrganisationsHandler)
      const requestSpy = vi.fn()
      mswServer.events.on('request:start', requestSpy)

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/organisations',
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        }
      })

      expect(statusCode).toBe(statusCodes.ok)

      // Basic page assertions
      expect(result).not.toEqual(expect.stringContaining('Sign in'))
      expect(result).toEqual(expect.stringContaining('Organisations'))

      // Table headers
      expect(result).toEqual(expect.stringContaining('Name'))
      expect(result).toEqual(expect.stringContaining('Organisation ID'))
      expect(result).toEqual(expect.stringContaining('Registration Number'))
      expect(result).toEqual(expect.stringContaining('Regulator'))
      expect(result).toEqual(expect.stringContaining('Status'))
      expect(result).toEqual(expect.stringContaining('Actions'))

      // Row data from mocked backend
      expect(result).toEqual(expect.stringContaining('Acme Ltd'))
      expect(result).toEqual(expect.stringContaining('org-1'))
      expect(result).toEqual(expect.stringContaining('12345678'))
      expect(result).toEqual(expect.stringContaining('REGULATOR-NAME'))
      expect(result).toEqual(expect.stringContaining('ACTIVE'))
      expect(result).toEqual(expect.stringContaining('/organisations/org-1'))
      expect(result).toEqual(expect.stringContaining('Edit'))

      expect(requestSpy).toHaveBeenCalledTimes(1)
    })

    test('Should show 500 error page when backend returns a non-OK response', async () => {
      const getOrganisationsHandler = http.get(
        `${backendUrl}/v1/organisations`,
        () => {
          throw HttpResponse.text('', { status: 500 })
        }
      )

      mswServer.use(getOrganisationsHandler)

      const { result } = await server.inject({
        method: 'GET',
        url: '/organisations',
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        }
      })

      expect(result).toEqual(
        expect.stringContaining('Sorry, there is a problem with the service')
      )
    })

    test('Should render without status when statusHistory is empty', async () => {
      // Organisation with empty statusHistory
      const mockOrganisations = [
        {
          id: 'org-2',
          orgId: 'org-2',
          status: null,
          statusHistory: [],
          companyDetails: {
            name: 'Beta Corp',
            registrationNumber: '87654321'
          },
          submittedToRegulator: 'regulator-name'
        }
      ]

      const getOrganisationsHandler = http.get(
        `${backendUrl}/v1/organisations`,
        () => {
          return HttpResponse.json(mockOrganisations)
        }
      )

      mswServer.use(getOrganisationsHandler)

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/organisations',
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        }
      })

      expect(statusCode).toBe(statusCodes.ok)

      // Page and table basics
      expect(result).toEqual(expect.stringContaining('Organisations'))
      expect(result).toEqual(expect.stringContaining('Name'))
      expect(result).toEqual(expect.stringContaining('Organisation ID'))
      expect(result).toEqual(expect.stringContaining('Registration Number'))
      expect(result).toEqual(expect.stringContaining('Regulator'))
      expect(result).toEqual(expect.stringContaining('Status'))

      // Row content excluding status value
      expect(result).toEqual(expect.stringContaining('Beta Corp'))
      expect(result).toEqual(expect.stringContaining('org-2'))
      expect(result).toEqual(expect.stringContaining('87654321'))
      expect(result).toEqual(expect.stringContaining('REGULATOR-NAME'))

      // Ensure status text is not the string 'undefined'
      expect(result).not.toEqual(expect.stringContaining('undefined'))

      // govukTag should still be present but with empty content
      expect(result).toEqual(expect.stringContaining('govuk-tag'))
    })

    test('Should display message when backend returns non array', async () => {
      const getOrganisationsHandler = http.get(
        `${backendUrl}/v1/organisations`,
        () => {
          return HttpResponse.json({})
        }
      )

      mswServer.use(getOrganisationsHandler)

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/organisations',
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        }
      })

      expect(statusCode).toBe(statusCodes.ok)

      // Should render the inset text message instead of a table
      expect(result).toEqual(expect.stringContaining('No organisations found.'))
      expect(result).not.toEqual(expect.stringContaining('Organisation ID'))
    })
  })
})
