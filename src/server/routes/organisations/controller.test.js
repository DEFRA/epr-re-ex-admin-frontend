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
    vi.unstubAllGlobals?.()
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
        json: async () => mockOrganisations
      })

      // Stub global fetch used by the controller
      if (typeof vi.stubGlobal === 'function') {
        vi.stubGlobal('fetch', fetchMock)
      } else {
        global.fetch = fetchMock
      }

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
        expect.stringMatching(/\/organisations$/)
      )
    })
  })
})
