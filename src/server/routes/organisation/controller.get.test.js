import { vi } from 'vitest'
import { createServer } from '#server/server.js'
import { statusCodes } from '#server/common/constants/status-codes.js'
import { mockUserSession } from '#server/common/test-helpers/fixtures.js'
import { getUserSession } from '#server/common/helpers/auth/get-user-session.js'
import { createMockOidcServer } from '#server/common/test-helpers/mock-oidc.js'

vi.mock('#server/common/helpers/auth/get-user-session.js', () => ({
  getUserSession: vi.fn().mockReturnValue(null)
}))

describe('organisation GET controller', () => {
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
        method: 'GET',
        url: '/organisations/123'
      })

      expect(statusCode).toBe(statusCodes.unauthorised)
      expect(result).toEqual(expect.stringContaining('Unauthorised'))
    })
  })

  describe('When user is authenticated', () => {
    test('Should return OK and render organisation detail page with valid data', async () => {
      // Mock an authenticated session
      getUserSession.mockReturnValue(mockUserSession)

      // Mock backend API response for single organisation
      const mockOrganisation = {
        id: 'org-1',
        orgId: 'org-1',
        version: 1,
        status: 'ACTIVE',
        companyDetails: {
          name: 'Acme Ltd',
          registrationNumber: '12345678'
        }
      }

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockOrganisation
      })

      vi.stubGlobal('fetch', fetchMock)

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

      // Check that organisation JSON is safely embedded
      expect(result).toEqual(expect.stringContaining('org-1'))
      expect(result).toEqual(expect.stringContaining('Acme Ltd'))

      // Verify fetch was called with correct URL (fetchJsonFromBackend adds undefined options)
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3001/v1/organisations/org-1',
        undefined
      )
    })

    test('Should safely escape dangerous JSON characters', async () => {
      getUserSession.mockReturnValue(mockUserSession)

      // Mock organisation with dangerous characters
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
        method: 'GET',
        url: '/organisations/org-1',
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
      expect(result).not.toEqual(expect.stringContaining('</script><script>alert'))
    })

    test('Should show 500 error page when backend returns unauthorised', async () => {
      getUserSession.mockReturnValue(mockUserSession)

      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      })

      vi.stubGlobal('fetch', fetchMock)

      const { result } = await server.inject({
        method: 'GET',
        url: '/organisations/org-1',
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        }
      })

      expect(result).toEqual(expect.stringContaining('Unauthorised'))
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    test('Should show 500 error page when backend returns non-OK response', async () => {
      getUserSession.mockReturnValue(mockUserSession)

      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        statusText: 'Bad Gateway'
      })

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
