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
    test('Should successfully update organisation and redirect to GET page', async () => {
      // Mock an authenticated session
      getUserSession.mockReturnValue(mockUserSession)

      // Mock successful backend API response
      const mockUpdatedOrganisation = {
        id: 'org-1',
        version: 2,
        companyDetails: {
          name: 'Updated Acme Ltd',
          registrationNumber: '12345678'
        }
      }

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockUpdatedOrganisation
      })

      vi.stubGlobal('fetch', fetchMock)

      const postData = {
        version: 1,
        companyDetails: {
          name: 'Updated Acme Ltd',
          registrationNumber: '12345678'
        }
      }

      const { result, statusCode } = await server.inject({
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

      expect(statusCode).toBe(statusCodes.ok)

      // Verify the page shows success message
      expect(result).toEqual(expect.stringContaining('Organisation'))
      expect(result).toEqual(expect.stringContaining('Updated Acme Ltd'))

      // Verify fetch was called with correct parameters
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3001/v1/organisations/org-1',
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

    test('Should handle backend error and display error messages', async () => {
      // Mock an authenticated session
      getUserSession.mockReturnValue(mockUserSession)

      // Mock the original organisation data that will be refetched
      const mockOriginalOrganisation = {
        id: 'org-1',
        version: 1,
        companyDetails: {
          name: 'Original Acme Ltd',
          registrationNumber: '12345678'
        }
      }

      fetchJsonFromBackend.mockResolvedValue(mockOriginalOrganisation)

      // Mock backend API error response
      const mockErrorResponse = {
        message:
          'Validation Error: Field "companyDetails.name" is required; Field "version" must be a number'
      }

      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => mockErrorResponse
      })

      vi.stubGlobal('fetch', fetchMock)

      const postData = {
        version: 1,
        companyDetails: {
          name: '',
          registrationNumber: '12345678'
        }
      }

      const { result, statusCode } = await server.inject({
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

      expect(statusCode).toBe(statusCodes.ok)

      // Verify error title and messages are displayed
      expect(result).toEqual(expect.stringContaining('Validation Error'))
      expect(result).toEqual(expect.stringContaining('companyDetails.name'))
      expect(result).toEqual(expect.stringContaining('version'))

      // Verify fetchJsonFromBackend was called to get original data
      expect(fetchJsonFromBackend).toHaveBeenCalledWith(
        expect.any(Object),
        '/v1/organisations/org-1',
        {}
      )

      // Verify the original organisation data is included in the response
      expect(result).toEqual(expect.stringContaining('Original Acme Ltd'))
    })

    test('Should handle backend error with simple message format', async () => {
      // Mock an authenticated session
      getUserSession.mockReturnValue(mockUserSession)

      const mockOriginalOrganisation = {
        id: 'org-2',
        version: 5,
        companyDetails: {
          name: 'Test Company',
          registrationNumber: '87654321'
        }
      }

      fetchJsonFromBackend.mockResolvedValue(mockOriginalOrganisation)

      // Mock backend API error response with simple message
      const mockErrorResponse = {
        message: 'Conflict Error: Organisation version mismatch'
      }

      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => mockErrorResponse
      })

      vi.stubGlobal('fetch', fetchMock)

      const postData = {
        version: 3,
        companyDetails: {
          name: 'Test Company',
          registrationNumber: '87654321'
        }
      }

      const { result, statusCode } = await server.inject({
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

      expect(statusCode).toBe(statusCodes.ok)

      // Verify error title is displayed
      expect(result).toEqual(expect.stringContaining('Conflict Error'))
      // Verify error message is displayed
      expect(result).toEqual(
        expect.stringContaining('Organisation version mismatch')
      )

      // Verify fetchJsonFromBackend was called
      expect(fetchJsonFromBackend).toHaveBeenCalledWith(
        expect.any(Object),
        '/v1/organisations/org-2',
        {}
      )
    })

    test('Should handle backend server error', async () => {
      // Mock an authenticated session
      getUserSession.mockReturnValue(mockUserSession)

      const mockOriginalOrganisation = {
        id: 'org-3',
        version: 1,
        companyDetails: {
          name: 'Server Error Company',
          registrationNumber: '11111111'
        }
      }

      fetchJsonFromBackend.mockResolvedValue(mockOriginalOrganisation)

      // Mock backend API 500 error
      const mockErrorResponse = {
        message: 'Internal Server Error: Database connection failed'
      }

      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => mockErrorResponse
      })

      vi.stubGlobal('fetch', fetchMock)

      const postData = {
        version: 1,
        companyDetails: {
          name: 'Updated Name',
          registrationNumber: '11111111'
        }
      }

      const { result, statusCode } = await server.inject({
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

      expect(statusCode).toBe(statusCodes.ok)

      // Verify error is displayed
      expect(result).toEqual(expect.stringContaining('Internal Server Error'))
      expect(result).toEqual(
        expect.stringContaining('Database connection failed')
      )

      // Verify the original data was fetched
      expect(fetchJsonFromBackend).toHaveBeenCalledWith(
        expect.any(Object),
        '/v1/organisations/org-3',
        {}
      )

      // Verify original data is shown
      expect(result).toEqual(expect.stringContaining('Server Error Company'))
    })

    test('Should use correct organisation ID from route params', async () => {
      // Mock an authenticated session
      getUserSession.mockReturnValue(mockUserSession)

      const mockUpdatedOrganisation = {
        id: 'specific-org-id-456',
        version: 2,
        companyDetails: {
          name: 'Specific Company',
          registrationNumber: '99999999'
        }
      }

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockUpdatedOrganisation
      })

      vi.stubGlobal('fetch', fetchMock)

      const postData = {
        version: 1,
        companyDetails: {
          name: 'Specific Company',
          registrationNumber: '99999999'
        }
      }

      await server.inject({
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

      // Verify the correct ID was used in the fetch URL
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3001/v1/organisations/specific-org-id-456',
        expect.any(Object)
      )
    })
  })
})
