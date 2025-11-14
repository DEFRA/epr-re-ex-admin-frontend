import { vi } from 'vitest'
import { createServer } from '#server/server.js'
import { statusCodes } from '#server/common/constants/status-codes.js'
import { mockUserSession } from '#server/common/test-helpers/fixtures.js'
import { getUserSession } from '#server/common/helpers/auth/get-user-session.js'
import { createMockOidcServer } from '#server/common/test-helpers/mock-oidc.js'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

vi.mock('#server/common/helpers/auth/get-user-session.js', () => ({
  getUserSession: vi.fn().mockReturnValue(null)
}))

vi.mock('#server/common/helpers/fetch-json-from-backend.js', () => ({
  fetchJsonFromBackend: vi.fn()
}))

describe('organisation POST controller', () => {
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
    })

    test('Should successfully update organisation and redirect with success message in session', async () => {
      const mockUpdatedOrganisation = {
        id: 'org-1',
        version: 2,
        companyDetails: {
          name: 'Updated Acme Ltd',
          registrationNumber: '12345678'
        }
      }

      // Mock fetchJsonFromBackend to return the parsed JSON directly
      fetchJsonFromBackend.mockResolvedValue(mockUpdatedOrganisation)

      const postData = {
        version: 1,
        companyDetails: {
          name: 'Updated Acme Ltd',
          registrationNumber: '12345678'
        }
      }

      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: '/organisations/org-1',
        payload: {
          organisation: JSON.stringify(postData)
        },
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        }
      })

      // Should redirect (302 Found)
      expect(statusCode).toBe(302)
      expect(headers.location).toBe('/organisations/org-1')

      // Verify fetchJsonFromBackend was called with correct parameters
      expect(fetchJsonFromBackend).toHaveBeenCalledWith(
        expect.anything(),
        '/v1/organisations/org-1',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            version: 1,
            updateFragment: postData
          })
        }
      )
    })

    test('Should handle backend validation error and redirect with error messages in session', async () => {
      const mockErrorResponse = {
        message:
          'Validation Error: Field "companyDetails.name" is required; Field "version" must be a number'
      }

      // Mock fetchJsonFromBackend to throw a Boom error
      const boomError = new Error('Bad Request')
      boomError.isBoom = true
      boomError.output = {
        statusCode: 400,
        payload: mockErrorResponse
      }
      fetchJsonFromBackend.mockRejectedValue(boomError)

      const postData = {
        version: 1,
        companyDetails: {
          name: '',
          registrationNumber: '12345678'
        }
      }

      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: '/organisations/org-1',
        payload: {
          organisation: JSON.stringify(postData)
        },
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        }
      })

      // Should redirect (302 Found)
      expect(statusCode).toBe(302)
      expect(headers.location).toBe('/organisations/org-1')
    })

    test('Should handle backend error with simple message format', async () => {
      const mockErrorResponse = {
        message: 'Conflict Error: Organisation version mismatch'
      }

      // Mock fetchJsonFromBackend to throw a Boom error
      const boomError = new Error('Conflict')
      boomError.isBoom = true
      boomError.output = {
        statusCode: 409,
        payload: mockErrorResponse
      }
      fetchJsonFromBackend.mockRejectedValue(boomError)

      const postData = {
        version: 3,
        companyDetails: {
          name: 'Test Company',
          registrationNumber: '87654321'
        }
      }

      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: '/organisations/org-2',
        payload: {
          organisation: JSON.stringify(postData)
        },
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        }
      })

      // Should redirect (302 Found)
      expect(statusCode).toBe(302)
      expect(headers.location).toBe('/organisations/org-2')
    })

    test('Should handle backend server error and redirect', async () => {
      const mockErrorResponse = {
        message: 'Internal Server Error: Database connection failed'
      }

      // Mock fetchJsonFromBackend to throw a Boom error
      const boomError = new Error('Internal Server Error')
      boomError.isBoom = true
      boomError.output = {
        statusCode: 500,
        payload: mockErrorResponse
      }
      fetchJsonFromBackend.mockRejectedValue(boomError)

      const postData = {
        version: 1,
        companyDetails: {
          name: 'Updated Name',
          registrationNumber: '11111111'
        }
      }

      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: '/organisations/org-3',
        payload: {
          organisation: JSON.stringify(postData)
        },
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        }
      })

      // Should redirect (302 Found)
      expect(statusCode).toBe(302)
      expect(headers.location).toBe('/organisations/org-3')
    })

    test('Should use correct organisation ID from route params', async () => {
      const mockUpdatedOrganisation = {
        id: 'specific-org-id-456',
        version: 2,
        companyDetails: {
          name: 'Specific Company',
          registrationNumber: '99999999'
        }
      }

      // Mock fetchJsonFromBackend to return a Response-like object
      fetchJsonFromBackend.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockUpdatedOrganisation
      })

      const postData = {
        version: 1,
        companyDetails: {
          name: 'Specific Company',
          registrationNumber: '99999999'
        }
      }

      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: '/organisations/specific-org-id-456',
        payload: {
          organisation: JSON.stringify(postData)
        },
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        }
      })

      // Verify the correct ID was used in the fetchJsonFromBackend call
      expect(fetchJsonFromBackend).toHaveBeenCalledWith(
        expect.anything(),
        '/v1/organisations/specific-org-id-456',
        expect.any(Object)
      )

      // Should redirect to correct URL (302 Found)
      expect(statusCode).toBe(302)
      expect(headers.location).toBe('/organisations/specific-org-id-456')
    })
  })
})
