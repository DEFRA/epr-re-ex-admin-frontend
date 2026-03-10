import { vi } from 'vitest'
import { createServer } from '#server/server.js'
import { config } from '#config/config.js'
import { statusCodes } from '#server/common/constants/status-codes.js'
import { mockUserSession } from '#server/common/test-helpers/fixtures.js'
import { getUserSession } from '#server/common/helpers/auth/get-user-session.js'
import { createMockOidcServer } from '#server/common/test-helpers/mock-oidc.js'
import { http, server as mswServer, HttpResponse } from '#vite/setup-msw.js'
import * as cheerio from 'cheerio'

vi.mock('#server/common/helpers/auth/get-user-session.js', () => ({
  getUserSession: vi.fn().mockReturnValue(null)
}))

const originalGet = config.get.bind(config)
const importId = 'import-abc-123'

describe('GET /overseas-sites/imports/{importId}', () => {
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
    vi.restoreAllMocks()
  })

  const stubBackendResponse = (response) => {
    mswServer.use(
      http.get(
        `${originalGet('eprBackendUrl')}/v1/overseas-sites/imports/${importId}`,
        () => response
      )
    )
  }

  describe('When user is unauthenticated', () => {
    test('Should return unauthorised status code', async () => {
      const { statusCode } = await server.inject({
        method: 'GET',
        url: `/overseas-sites/imports/${importId}`
      })

      expect(statusCode).toBe(statusCodes.unauthorised)
    })
  })

  describe('When feature flag is disabled', () => {
    beforeEach(() => {
      getUserSession.mockReturnValue(mockUserSession)
    })

    test('Should return 404 when orsEnabled is false', async () => {
      const { statusCode } = await server.inject({
        method: 'GET',
        url: `/overseas-sites/imports/${importId}`,
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        }
      })

      expect(statusCode).toBe(statusCodes.notFound)
    })
  })

  describe('When feature flag is enabled', () => {
    beforeEach(() => {
      getUserSession.mockReturnValue(mockUserSession)
      vi.spyOn(config, 'get').mockImplementation((key) => {
        if (key === 'features.orsEnabled') return true
        return originalGet(key)
      })
    })

    describe('When import is preprocessing', () => {
      test('Should render progress page with meta refresh', async () => {
        stubBackendResponse(
          HttpResponse.json({
            id: importId,
            status: 'preprocessing',
            files: []
          })
        )

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: `/overseas-sites/imports/${importId}`,
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })

        expect(statusCode).toBe(statusCodes.ok)

        const $ = cheerio.load(result)
        expect($('h1').text().trim()).toBe('Import in progress')
        expect($('meta[http-equiv="refresh"]').attr('content')).toBe(
          `3; url=/overseas-sites/imports/${importId}`
        )
      })
    })

    describe('When import is processing', () => {
      test('Should render progress page with meta refresh', async () => {
        stubBackendResponse(
          HttpResponse.json({
            id: importId,
            status: 'processing',
            files: []
          })
        )

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: `/overseas-sites/imports/${importId}`,
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })

        expect(statusCode).toBe(statusCodes.ok)

        const $ = cheerio.load(result)
        expect($('h1').text().trim()).toBe('Import in progress')
        expect($('meta[http-equiv="refresh"]')).toHaveLength(1)
      })
    })

    describe('When import is completed', () => {
      test('Should render results page with file details', async () => {
        stubBackendResponse(
          HttpResponse.json({
            id: importId,
            status: 'completed',
            files: [
              {
                fileId: 'file-1',
                fileName: 'ors-sites.xlsx',
                result: {
                  status: 'completed',
                  sitesCreated: 5,
                  mappingsUpdated: 3,
                  errors: []
                }
              }
            ]
          })
        )

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: `/overseas-sites/imports/${importId}`,
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })

        expect(statusCode).toBe(statusCodes.ok)

        const $ = cheerio.load(result)
        expect($('h1').text().trim()).toBe('Import complete')
        expect($('meta[http-equiv="refresh"]')).toHaveLength(0)
        expect($.text()).toContain('ors-sites.xlsx')
        expect($.text()).toContain('5')
        expect($.text()).toContain('3')
      })

      test('Should render results page when files is missing from response', async () => {
        stubBackendResponse(
          HttpResponse.json({
            id: importId,
            status: 'completed'
          })
        )

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: `/overseas-sites/imports/${importId}`,
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })

        expect(statusCode).toBe(statusCodes.ok)

        const $ = cheerio.load(result)
        expect($('h1').text().trim()).toBe('Import complete')
      })

      test('Should render results page with errors when present', async () => {
        stubBackendResponse(
          HttpResponse.json({
            id: importId,
            status: 'completed',
            files: [
              {
                fileId: 'file-1',
                fileName: 'ors-sites.xlsx',
                result: {
                  status: 'completed',
                  sitesCreated: 2,
                  mappingsUpdated: 0,
                  errors: [
                    'Row 3: invalid country code',
                    'Row 7: missing site name'
                  ]
                }
              }
            ]
          })
        )

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: `/overseas-sites/imports/${importId}`,
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })

        expect(statusCode).toBe(statusCodes.ok)

        const $ = cheerio.load(result)
        expect($.text()).toContain('2 errors')
        expect($.text()).toContain('Row 3: invalid country code')
        expect($.text()).toContain('Row 7: missing site name')
      })
    })

    describe('When import has failed', () => {
      test('Should render failed page with retry link', async () => {
        stubBackendResponse(
          HttpResponse.json({
            id: importId,
            status: 'failed',
            files: []
          })
        )

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: `/overseas-sites/imports/${importId}`,
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })

        expect(statusCode).toBe(statusCodes.ok)

        const $ = cheerio.load(result)
        expect($('h1').text().trim()).toBe('Import failed')
        expect($('a[href="/overseas-sites/upload"]').text()).toContain(
          'Try again'
        )
      })
    })

    describe('When backend returns an error', () => {
      test('Should return 500 when backend fails', async () => {
        stubBackendResponse(
          HttpResponse.json(
            { error: 'Server error' },
            { status: statusCodes.internalServerError }
          )
        )

        const { statusCode } = await server.inject({
          method: 'GET',
          url: `/overseas-sites/imports/${importId}`,
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })

        expect(statusCode).toBe(statusCodes.internalServerError)
      })
    })
  })
})
