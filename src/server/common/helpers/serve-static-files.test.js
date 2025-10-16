import { vi } from 'vitest'
import { startServer } from './start-server.js'
import { statusCodes } from '../constants/status-codes.js'
import { createMockOidcServer } from '#server/common/test-helpers/mock-oidc.js'

describe('#serveStaticFiles', () => {
  let server

  beforeAll(() => {
    vi.stubEnv('PORT', '3098')
  })

  afterAll(() => {
    vi.unstubAllEnvs()
  })

  describe('When secure context is disabled', () => {
    beforeEach(async () => {
      createMockOidcServer()
      server = await startServer()
    })

    afterEach(async () => {
      await server.stop({ timeout: 0 })
    })

    test('Should serve favicon as expected', async () => {
      const { statusCode } = await server.inject({
        method: 'GET',
        url: '/favicon.ico'
      })

      expect(statusCode).toBe(statusCodes.noContent)
    })

    test('Should serve assets as expected', async () => {
      // Note npm run build is ran in the postinstall hook in package.json to make sure there is always a file
      // available for this test. Remove as you see fit
      const { statusCode } = await server.inject({
        method: 'GET',
        url: '/public/assets/images/govuk-crest.svg'
      })

      expect(statusCode).toBe(statusCodes.ok)
    })
  })
})
