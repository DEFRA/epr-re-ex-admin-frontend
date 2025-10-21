import { vi } from 'vitest'
import { createServer } from '#server/server.js'
import { statusCodes } from '#server/common/constants/status-codes.js'
import { mockUserSession } from '#server/common/test-helpers/fixtures.js'
import { getUserSession } from '#server/common/helpers/auth/get-user-session.js'
import { createMockOidcServer } from '#server/common/test-helpers/mock-oidc.js'

vi.mock('#server/common/helpers/auth/get-user-session.js', () => ({
  getUserSession: vi.fn().mockReturnValue(null)
}))

describe('#organisationsController', () => {
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
        url: '/organisations'
      })

      expect(statusCode).toBe(statusCodes.unauthorised)
      expect(result).toEqual(expect.stringContaining('Unauthorised'))
    })
  })

  describe('When user is authenticated', () => {
    test('Should return OK and render organisations table from backend data', async () => {
      // Mock an authenticated session
      getUserSession.mockReturnValue(mockUserSession)

      // Mock backend API response for organisations
      const mockOrganisations = [
        {
          orgId: 'org-1',
          statusHistory: [
            { status: 'PENDING', updatedAt: '2025-09-01T00:00:00Z' },
            { status: 'ACTIVE', updatedAt: '2025-10-01T00:00:00Z' }
          ],
          companyDetails: {
            name: 'Acme Ltd',
            registrationNumber: '12345678'
          }
        }
      ]

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockOrganisations
      })

      vi.stubGlobal('fetch', fetchMock)

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
      expect(result).toEqual(expect.stringContaining('Status'))
      expect(result).toEqual(expect.stringContaining('Actions'))

      // Row data from mocked backend
      expect(result).toEqual(expect.stringContaining('Acme Ltd'))
      expect(result).toEqual(expect.stringContaining('org-1'))
      expect(result).toEqual(expect.stringContaining('12345678'))
      expect(result).toEqual(expect.stringContaining('ACTIVE'))
      expect(result).toEqual(expect.stringContaining('/organisations/org-1'))
      expect(result).toEqual(expect.stringContaining('Edit'))

      // Ensure backend was called for organisations
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringMatching(/\/organisations$/),
        undefined
      )
    })

    test('Should show 500 error page when backend returns a non-OK response', async () => {
      getUserSession.mockReturnValue(mockUserSession)

      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
        json: async () => ({ message: 'Upstream error' })
      })

      vi.stubGlobal('fetch', fetchMock)

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
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    test('Should show 500 error page when backend fetch throws', async () => {
      getUserSession.mockReturnValue(mockUserSession)

      const fetchMock = vi.fn().mockRejectedValue(new Error('network down'))

      vi.stubGlobal('fetch', fetchMock)

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
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    test('Should render without status when statusHistory is empty', async () => {
      // Mock an authenticated session
      getUserSession.mockReturnValue(mockUserSession)

      // Organisation with empty statusHistory
      const mockOrganisations = [
        {
          orgId: 'org-2',
          statusHistory: [],
          companyDetails: {
            name: 'Beta Corp',
            registrationNumber: '87654321'
          }
        }
      ]

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockOrganisations
      })

      vi.stubGlobal('fetch', fetchMock)

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
      expect(result).toEqual(expect.stringContaining('Status'))

      // Row content excluding status value
      expect(result).toEqual(expect.stringContaining('Beta Corp'))
      expect(result).toEqual(expect.stringContaining('org-2'))
      expect(result).toEqual(expect.stringContaining('87654321'))

      // Ensure status text is not the string 'undefined'
      expect(result).not.toEqual(expect.stringContaining('undefined'))

      // govukTag should still be present but with empty content
      expect(result).toEqual(expect.stringContaining('govuk-tag'))

      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    test('Should display message when backend returns non array', async () => {
      // Mock an authenticated session
      getUserSession.mockReturnValue(mockUserSession)

      // Backend returns empty list
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({})
      })

      vi.stubGlobal('fetch', fetchMock)

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

      expect(fetchMock).toHaveBeenCalledTimes(1)
    })
  })
})
