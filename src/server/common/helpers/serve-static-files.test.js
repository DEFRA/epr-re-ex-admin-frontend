import { vi } from 'vitest'
import { statusCodes } from '../constants/status-codes.js'
import { createMockOidcServer } from '#server/common/test-helpers/mock-oidc.js'

describe('#serveStaticFiles', () => {
  let server
  let startServer

  beforeAll(async () => {
    vi.stubEnv('PORT', '0')
    vi.resetModules()
    createMockOidcServer()
    const startServerModule = await import('./start-server.js')
    startServer = startServerModule.startServer
    server = await startServer()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
    vi.unstubAllEnvs()
  })

  describe('When secure context is disabled', () => {
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
