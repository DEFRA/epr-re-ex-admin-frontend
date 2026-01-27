import { vi, beforeEach } from 'vitest'
import { createServer } from '#server/server.js'
import { config } from '#config/config.js'
import { statusCodes } from '#server/common/constants/status-codes.js'
import { mockUserSession } from '#server/common/test-helpers/fixtures.js'
import { getUserSession } from '#server/common/helpers/auth/get-user-session.js'
import { createMockOidcServer } from '#server/common/test-helpers/mock-oidc.js'
import { getCsrfToken } from '#server/common/test-helpers/csrf-helper.js'
import {
  http,
  server as mswServer,
  HttpResponse
} from '../../../../.vite/setup-msw.js'
import * as cheerio from 'cheerio'

vi.mock('#server/common/helpers/auth/get-user-session.js', () => ({
  getUserSession: vi.fn().mockReturnValue(null)
}))

describe('public-register', () => {
  const backendUrl = config.get('eprBackendUrl')
  let server

  beforeAll(async () => {
    createMockOidcServer()
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  describe('GET /public-register', () => {
    describe('When user is unauthenticated', () => {
      beforeEach(() => {
        getUserSession.mockReturnValue(null)
      })

      test('Should return unauthorised status code', async () => {
        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/public-register'
        })

        expect(statusCode).toBe(statusCodes.unauthorised)
        expect(result).toEqual(expect.stringContaining('Unauthorised'))
      })
    })

    describe('When user is authenticated', () => {
      beforeEach(() => {
        getUserSession.mockReturnValue(mockUserSession)
      })

      test('Should return OK and render page with heading', async () => {
        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/public-register',
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })

        expect(statusCode).toBe(statusCodes.ok)

        const $ = cheerio.load(result)
        expect($('h1').text()).toContain('Public register')
      })

      test('Should render page with body text', async () => {
        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/public-register',
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })

        expect(statusCode).toBe(statusCodes.ok)

        const $ = cheerio.load(result)
        expect($('.govuk-body').text()).toContain(
          'full list of approved registrations and accreditations'
        )
      })

      test('Should render page with download button', async () => {
        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/public-register',
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })

        expect(statusCode).toBe(statusCodes.ok)

        const $ = cheerio.load(result)
        expect($('button.govuk-button').text().trim()).toBe(
          'Download public register'
        )
      })

      test('Should have navigation item for public register', async () => {
        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/public-register',
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })

        expect(statusCode).toBe(statusCodes.ok)

        const $ = cheerio.load(result)
        const navLink = $('a[href="/public-register"]')
        expect(navLink.length).toBeGreaterThan(0)
      })
    })
  })

  describe('POST /public-register', () => {
    describe('When user is unauthenticated', () => {
      beforeEach(() => {
        getUserSession.mockReturnValue(null)
      })

      test('Should return unauthorised status code', async () => {
        const { result, statusCode } = await server.inject({
          method: 'POST',
          url: '/public-register',
          payload: {}
        })

        expect(statusCode).toBe(statusCodes.unauthorised)
        expect(result).toEqual(expect.stringContaining('Unauthorised'))
      })
    })

    describe('When user is authenticated', () => {
      test('Should redirect to downloadUrl on successful generation', async () => {
        getUserSession.mockReturnValue(mockUserSession)

        const mockDownloadUrl =
          'https://s3.example.com/public-register.csv?signed=abc123'

        mswServer.use(
          http.post(`${backendUrl}/v1/public-register/generate`, () => {
            return HttpResponse.json(
              {
                status: 'generated',
                downloadUrl: mockDownloadUrl,
                generatedAt: '2026-01-26T14:15:30.123Z',
                expiresAt: '2026-01-26T15:15:30.123Z'
              },
              { status: 201 }
            )
          })
        )

        const { cookie, crumb } = await getCsrfToken(
          server,
          '/public-register',
          { strategy: 'session', credentials: mockUserSession }
        )

        const { statusCode, headers } = await server.inject({
          method: 'POST',
          url: '/public-register',
          headers: { cookie },
          payload: { crumb },
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })

        expect(statusCode).toBe(302)
        expect(headers.location).toBe(mockDownloadUrl)
      })

      test('Should redirect back to GET with error on backend failure', async () => {
        getUserSession.mockReturnValue(mockUserSession)

        mswServer.use(
          http.post(`${backendUrl}/v1/public-register/generate`, () => {
            return HttpResponse.json(
              { message: 'Generation failed' },
              { status: 500 }
            )
          })
        )

        const { cookie, crumb } = await getCsrfToken(
          server,
          '/public-register',
          { strategy: 'session', credentials: mockUserSession }
        )

        const { statusCode, headers } = await server.inject({
          method: 'POST',
          url: '/public-register',
          headers: { cookie },
          payload: { crumb },
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })

        expect(statusCode).toBe(302)
        expect(headers.location).toBe('/public-register')
      })
    })
  })
})
