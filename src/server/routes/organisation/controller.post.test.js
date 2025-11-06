import { vi } from 'vitest'
import { createServer } from '#server/server.js'
import { statusCodes } from '#server/common/constants/status-codes.js'
import { mockUserSession } from '#server/common/test-helpers/fixtures.js'
import { getUserSession } from '#server/common/helpers/auth/get-user-session.js'
import { createMockOidcServer } from '#server/common/test-helpers/mock-oidc.js'

vi.mock('#server/common/helpers/auth/get-user-session.js', () => ({
  getUserSession: vi.fn().mockReturnValue(null)
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
  })
})
