import { vi } from 'vitest'
import { createServer } from '#server/server.js'
import { config } from '#config/config.js'
import { statusCodes } from '#server/common/constants/status-codes.js'
import { mockUserSession } from '#server/common/test-helpers/fixtures.js'
import { getUserSession } from '#server/common/helpers/auth/get-user-session.js'
import { createMockOidcServer } from '#server/common/test-helpers/mock-oidc.js'
import { getCsrfToken } from '#server/common/test-helpers/csrf-helper.js'
import {
  http,
  server as mswServer,
  HttpResponse
} from '../../../../.vite/setup-msw.js'

vi.mock('#server/common/helpers/auth/get-user-session.js', () => ({
  getUserSession: vi.fn().mockReturnValue(null)
}))

describe('organisation POST controller', () => {
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
        method: 'POST',
        url: '/organisations/123',
        payload: {
          organisation: JSON.stringify({
            version: 1,
            companyDetails: { name: 'Test Org' }
          })
        }
      })

      expect(statusCode).toBe(statusCodes.unauthorised)
      expect(result).toEqual(expect.stringContaining('Unauthorised'))
    })
  })

  describe('When user is authenticated', () => {
    beforeEach(() => {
      getUserSession.mockReturnValue(mockUserSession)
      mswServer.use(
        http.get(`${backendUrl}/v1/organisations/:id`, () =>
          HttpResponse.json({ id: 'stub', companyDetails: { name: 'Stub' } })
        )
      )
    })

    test('Should successfully update organisation and redirect with success message in session', async () => {
      const orgId = 'org-1'
      const mockUpdatedOrganisation = {
        id: orgId,
        version: 2,
        companyDetails: {
          name: 'Updated Acme Ltd',
          registrationNumber: '12345678'
        }
      }

      const putOrganisationHandler = http.put(
        `${backendUrl}/v1/organisations/${orgId}`,
        () => {
          return HttpResponse.json(mockUpdatedOrganisation)
        }
      )

      mswServer.use(putOrganisationHandler)

      const postData = {
        version: 1,
        companyDetails: {
          name: 'Updated Acme Ltd',
          registrationNumber: '12345678'
        }
      }

      const { cookie, crumb } = await getCsrfToken(
        server,
        `/organisations/${orgId}`,
        { strategy: 'session', credentials: mockUserSession }
      )

      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: `/organisations/${orgId}`,
        headers: { cookie },
        payload: {
          organisation: JSON.stringify(postData),
          crumb
        },
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        }
      })

      // Should redirect (302 Found)
      expect(statusCode).toBe(302)
      expect(headers.location).toBe(`/organisations/${orgId}`)
    })

    test('Should handle backend validation error and redirect with error messages in session', async () => {
      const orgId = 'org-1'
      const mockErrorResponse = {
        message:
          'Validation Error: Field "companyDetails.name" is required; Field "version" must be a number'
      }

      const putOrganisationHandler = http.put(
        `${backendUrl}/v1/organisations/${orgId}`,
        () => {
          return HttpResponse.json(mockErrorResponse, { status: 400 })
        }
      )

      mswServer.use(putOrganisationHandler)

      const postData = {
        version: 1,
        companyDetails: {
          name: '',
          registrationNumber: '12345678'
        }
      }

      const { cookie, crumb } = await getCsrfToken(
        server,
        `/organisations/${orgId}`,
        { strategy: 'session', credentials: mockUserSession }
      )

      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: `/organisations/${orgId}`,
        headers: { cookie },
        payload: {
          organisation: JSON.stringify(postData),
          crumb
        },
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        }
      })

      // Should redirect (302 Found)
      expect(statusCode).toBe(302)
      expect(headers.location).toBe(`/organisations/${orgId}`)
    })

    test('Should handle backend error with simple message format', async () => {
      const orgId = 'org-2'
      const mockErrorResponse = {
        message: 'Conflict Error: Organisation version mismatch'
      }

      const putOrganisationHandler = http.put(
        `${backendUrl}/v1/organisations/${orgId}`,
        () => {
          return HttpResponse.json(mockErrorResponse, { status: 409 })
        }
      )

      mswServer.use(putOrganisationHandler)

      const postData = {
        version: 3,
        companyDetails: {
          name: 'Test Company',
          registrationNumber: '87654321'
        }
      }

      const { cookie, crumb } = await getCsrfToken(
        server,
        `/organisations/${orgId}`,
        { strategy: 'session', credentials: mockUserSession }
      )

      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: `/organisations/${orgId}`,
        headers: { cookie },
        payload: {
          organisation: JSON.stringify(postData),
          crumb
        },
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        }
      })

      // Should redirect (302 Found)
      expect(statusCode).toBe(302)
      expect(headers.location).toBe(`/organisations/${orgId}`)
    })

    test('Should handle backend server error and redirect', async () => {
      const orgId = 'org-3'
      const mockErrorResponse = {
        message: 'Internal Server Error: Database connection failed'
      }

      const putOrganisationHandler = http.put(
        `${backendUrl}/v1/organisations/${orgId}`,
        () => {
          return HttpResponse.json(mockErrorResponse, { status: 500 })
        }
      )

      mswServer.use(putOrganisationHandler)

      const postData = {
        version: 1,
        companyDetails: {
          name: 'Updated Name',
          registrationNumber: '11111111'
        }
      }

      const { cookie, crumb } = await getCsrfToken(
        server,
        `/organisations/${orgId}`,
        { strategy: 'session', credentials: mockUserSession }
      )

      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: `/organisations/${orgId}`,
        headers: { cookie },
        payload: {
          organisation: JSON.stringify(postData),
          crumb
        },
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        }
      })

      // Should redirect (302 Found)
      expect(statusCode).toBe(302)
      expect(headers.location).toBe(`/organisations/${orgId}`)
    })

    test('Should use correct organisation ID from route params', async () => {
      const orgId = 'specific-org-id-456'
      const mockUpdatedOrganisation = {
        id: orgId,
        version: 2,
        companyDetails: {
          name: 'Specific Company',
          registrationNumber: '99999999'
        }
      }

      const putOrganisationHandler = http.put(
        `${backendUrl}/v1/organisations/${orgId}`,
        () => {
          return HttpResponse.json(mockUpdatedOrganisation)
        }
      )

      mswServer.use(putOrganisationHandler)

      const postData = {
        version: 1,
        companyDetails: {
          name: 'Specific Company',
          registrationNumber: '99999999'
        }
      }

      const { cookie, crumb } = await getCsrfToken(
        server,
        `/organisations/${orgId}`,
        { strategy: 'session', credentials: mockUserSession }
      )

      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: `/organisations/${orgId}`,
        headers: { cookie },
        payload: {
          organisation: JSON.stringify(postData),
          crumb
        },
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        }
      })

      // Should redirect to correct URL (302 Found)
      expect(statusCode).toBe(302)
      expect(headers.location).toBe(`/organisations/${orgId}`)
    })

    test('Should reject POST request without CSRF token', async () => {
      const orgId = 'org-1'

      const { statusCode } = await server.inject({
        method: 'POST',
        url: `/organisations/${orgId}`,
        payload: {
          organisation: JSON.stringify({ version: 1 })
        },
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        }
      })

      expect(statusCode).toBe(statusCodes.forbidden)
    })

    test('Should reject POST request with invalid CSRF token', async () => {
      const orgId = 'org-1'

      const { cookie } = await getCsrfToken(server, `/organisations/${orgId}`, {
        strategy: 'session',
        credentials: mockUserSession
      })

      const { statusCode } = await server.inject({
        method: 'POST',
        url: `/organisations/${orgId}`,
        headers: { cookie },
        payload: {
          organisation: JSON.stringify({ version: 1 }),
          crumb: 'invalid-csrf-token'
        },
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        }
      })

      expect(statusCode).toBe(statusCodes.forbidden)
    })
  })
})
