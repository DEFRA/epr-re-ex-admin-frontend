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
    test('Should successfully update organisation and return success page', async () => {
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

    test('Should safely escape dangerous JSON characters in response', async () => {
      getUserSession.mockReturnValue(mockUserSession)

      // Mock organisation response with dangerous characters
      const mockOrganisation = {
        id: 'org-1',
        companyDetails: {
          name: '</script><script>alert("xss")</script>',
          description: 'Line separator\u2028and paragraph separator\u2029test'
        }
      }

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockOrganisation
      })

      vi.stubGlobal('fetch', fetchMock)

      const { result, statusCode } = await server.inject({
        method: 'POST',
        url: '/organisations/org-1',
        payload: {
          organisation: JSON.stringify({
            version: 1,
            companyDetails: { name: 'Test' }
          })
        },
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        }
      })

      expect(statusCode).toBe(statusCodes.ok)

      // Verify dangerous characters are escaped in the JSON script tag
      expect(result).toEqual(expect.stringContaining('\\u003c'))
      expect(result).toEqual(expect.stringContaining('\\u2028'))
      expect(result).toEqual(expect.stringContaining('\\u2029'))
      // Verify original dangerous characters are not present
      expect(result).not.toEqual(
        expect.stringContaining('</script><script>alert')
      )
    })

    test('Should handle HTML comment sequences safely', async () => {
      getUserSession.mockReturnValue(mockUserSession)

      const mockOrganisation = {
        id: 'org-1',
        companyDetails: {
          name: 'Test Company',
          description: 'This contains --> comment end sequence'
        }
      }

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockOrganisation
      })

      vi.stubGlobal('fetch', fetchMock)

      const { result, statusCode } = await server.inject({
        method: 'POST',
        url: '/organisations/org-1',
        payload: {
          organisation: JSON.stringify({
            version: 1,
            companyDetails: { name: 'Test' }
          })
        },
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        }
      })

      expect(statusCode).toBe(statusCodes.ok)

      // Verify HTML comment sequences are escaped
      expect(result).toEqual(expect.stringContaining('--\\u003e'))
      expect(result).not.toEqual(expect.stringContaining('-->'))
    })

    test('Should show 500 error page when backend request fails', async () => {
      getUserSession.mockReturnValue(mockUserSession)

      const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'))

      vi.stubGlobal('fetch', fetchMock)

      const { result } = await server.inject({
        method: 'POST',
        url: '/organisations/org-1',
        payload: {
          organisation: JSON.stringify({
            version: 1,
            companyDetails: { name: 'Test' }
          })
        },
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

    test('Should show 500 error page when backend returns non-OK response', async () => {
      getUserSession.mockReturnValue(mockUserSession)

      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })

      vi.stubGlobal('fetch', fetchMock)

      const { result } = await server.inject({
        method: 'POST',
        url: '/organisations/org-1',
        payload: {
          organisation: JSON.stringify({
            version: 1,
            companyDetails: { name: 'Test' }
          })
        },
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

    test('Should log errors to console when fetch fails', async () => {
      getUserSession.mockReturnValue(mockUserSession)

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      const fetchMock = vi.fn().mockRejectedValue(new Error('Network failure'))

      vi.stubGlobal('fetch', fetchMock)

      await server.inject({
        method: 'POST',
        url: '/organisations/org-1',
        payload: {
          organisation: JSON.stringify({
            version: 1,
            companyDetails: { name: 'Test' }
          })
        },
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        }
      })

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to update organisation:',
        expect.any(Error)
      )

      consoleErrorSpy.mockRestore()
    })

    test('Should log errors to console when response is not OK', async () => {
      getUserSession.mockReturnValue(mockUserSession)

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      })

      vi.stubGlobal('fetch', fetchMock)

      await server.inject({
        method: 'POST',
        url: '/organisations/org-1',
        payload: {
          organisation: JSON.stringify({
            version: 1,
            companyDetails: { name: 'Test' }
          })
        },
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        }
      })

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to update organisation:',
        'Bad Request'
      )

      consoleErrorSpy.mockRestore()
    })

    test('Should include success message in view context', async () => {
      getUserSession.mockReturnValue(mockUserSession)

      const mockOrganisation = {
        id: 'org-1',
        companyDetails: { name: 'Test Company' }
      }

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockOrganisation
      })

      vi.stubGlobal('fetch', fetchMock)

      const { result } = await server.inject({
        method: 'POST',
        url: '/organisations/org-1',
        payload: {
          organisation: JSON.stringify({
            version: 1,
            companyDetails: { name: 'Test Company' }
          })
        },
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        }
      })

      // The success message should be passed to the template
      // This would need to be verified based on how the template handles the message
      expect(result).toEqual(expect.stringContaining('Test Company'))
    })
  })
})
