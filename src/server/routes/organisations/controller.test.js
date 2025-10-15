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
    server = await createServer()
    createMockOidcServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
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
    test('Should provide return OK status code and show the protected page', async () => {
      getUserSession.mockReturnValue(mockUserSession)

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/organisations',
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        }
      })

      expect(result).not.toEqual(expect.stringContaining('Sign in'))
      expect(result).toEqual(
        expect.stringContaining('This is the organisations protected page')
      )
      expect(statusCode).toBe(statusCodes.ok)
    })
  })
})
