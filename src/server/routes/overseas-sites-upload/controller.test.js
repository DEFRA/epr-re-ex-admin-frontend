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

describe('GET /overseas-sites/upload', () => {
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
    const calls = []
    mswServer.use(
      http.post(
        `${originalGet('eprBackendUrl')}/v1/overseas-sites/imports`,
        async ({ request }) => {
          const body = await request.json()
          calls.push({ body })
          return response
        }
      )
    )
    return calls
  }

  describe('When user is unauthenticated', () => {
    test('Should return unauthorised status code', async () => {
      const { statusCode } = await server.inject({
        method: 'GET',
        url: '/overseas-sites/upload'
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
        url: '/overseas-sites/upload',
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

    test('Should render upload form with uploadUrl from backend', async () => {
      const uploadUrl = 'https://cdp-uploader.example.com/upload/abc123'
      stubBackendResponse(
        HttpResponse.json({
          id: 'import-123',
          status: 'preprocessing',
          uploadUrl,
          statusUrl: '/v1/overseas-sites/imports/import-123'
        })
      )

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/overseas-sites/upload',
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        }
      })

      expect(statusCode).toBe(statusCodes.ok)

      const $ = cheerio.load(result)
      expect($('h1').text().trim()).toBe('Upload overseas reprocessing sites')
      expect($('form').attr('action')).toBe(uploadUrl)
      expect($('form').attr('enctype')).toBe('multipart/form-data')
      expect($('input[type="file"]').attr('accept')).toBe('.xlsx')
    })

    test('Should send redirectUrl to backend when initiating import', async () => {
      const calls = stubBackendResponse(
        HttpResponse.json({
          id: 'import-123',
          status: 'preprocessing',
          uploadUrl: 'https://cdp-uploader.example.com/upload/abc123',
          statusUrl: '/v1/overseas-sites/imports/import-123'
        })
      )

      await server.inject({
        method: 'GET',
        url: '/overseas-sites/upload',
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        }
      })

      expect(calls).toHaveLength(1)
      expect(calls[0].body).toEqual({
        redirectUrl: `${originalGet('appBaseUrl')}/overseas-sites/imports/{importId}`
      })
    })

    test('Should return 500 when backend fails', async () => {
      stubBackendResponse(
        HttpResponse.json(
          { error: 'Server error' },
          { status: statusCodes.internalServerError }
        )
      )

      const { statusCode } = await server.inject({
        method: 'GET',
        url: '/overseas-sites/upload',
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        }
      })

      expect(statusCode).toBe(statusCodes.internalServerError)
    })
  })
})
