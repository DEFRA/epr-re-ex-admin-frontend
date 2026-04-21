import { vi } from 'vitest'
import { createServer } from '#server/server.js'
import { config } from '#config/config.js'
import { statusCodes } from '#server/common/constants/status-codes.js'
import { mockUserSession } from '#server/common/test-helpers/fixtures.js'
import { getUserSession } from '#server/common/helpers/auth/get-user-session.js'
import { createMockOidcServer } from '#server/common/test-helpers/mock-oidc.js'
import { getCsrfToken } from '#server/common/test-helpers/csrf-helper.js'
import { http, server as mswServer, HttpResponse } from '#vite/setup-msw.js'
import * as cheerio from 'cheerio'

vi.mock('#server/common/helpers/auth/get-user-session.js', () => ({
  getUserSession: vi.fn().mockReturnValue(null)
}))

describe('queue-management', () => {
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

  afterEach(() => {
    vi.clearAllMocks()
  })

  const stubDlqStatus = (messageCount) => {
    mswServer.use(
      http.get(`${backendUrl}/v1/admin/queues/dlq/status`, () =>
        HttpResponse.json({ approximateMessageCount: messageCount })
      )
    )
  }

  const stubDlqStatusError = () => {
    mswServer.use(
      http.get(`${backendUrl}/v1/admin/queues/dlq/status`, () =>
        HttpResponse.error()
      )
    )
  }

  const stubDlqPurge = () => {
    mswServer.use(
      http.post(`${backendUrl}/v1/admin/queues/dlq/purge`, () =>
        HttpResponse.json({ purged: true })
      )
    )
  }

  const stubDlqPurgeError = () => {
    mswServer.use(
      http.post(`${backendUrl}/v1/admin/queues/dlq/purge`, () =>
        HttpResponse.error()
      )
    )
  }

  describe('GET /queue-management', () => {
    describe('When user is unauthenticated', () => {
      test('Should return unauthorised status code', async () => {
        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/queue-management'
        })

        expect(statusCode).toBe(statusCodes.unauthorised)
        expect(result).toContain('Unauthorised')
      })
    })

    describe('When user is authenticated', () => {
      beforeEach(() => {
        getUserSession.mockReturnValue(mockUserSession)
      })

      test('Should return OK and render page with message count', async () => {
        stubDlqStatus(3)

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/queue-management',
          auth: { strategy: 'session', credentials: mockUserSession }
        })

        expect(statusCode).toBe(statusCodes.ok)

        const $ = cheerio.load(result)
        expect($('h1').text()).toContain('Queue management')
        expect(result).toContain('3')
      })

      test('Should render success banner after a successful purge redirect', async () => {
        stubDlqStatus(0)
        stubDlqPurge()

        // GET the confirm page to obtain crumb and session cookies
        const getResponse = await server.inject({
          method: 'GET',
          url: '/queue-management/confirm-clear',
          auth: { strategy: 'session', credentials: mockUserSession }
        })

        const setCookieHeader = getResponse.headers['set-cookie']
        const cookies = Array.isArray(setCookieHeader)
          ? setCookieHeader
          : [setCookieHeader].filter(Boolean)

        // Build a cookie header containing all session cookies
        const cookieHeader = cookies.map((c) => c.split(';')[0]).join('; ')

        const crumbCookie = cookies.find((c) => c.startsWith('crumb='))
        const crumb = crumbCookie ? crumbCookie.split(';')[0].split('=')[1] : ''

        // POST to trigger purge
        const postResponse = await server.inject({
          method: 'POST',
          url: '/queue-management/clear',
          headers: { cookie: cookieHeader },
          payload: { crumb },
          auth: { strategy: 'session', credentials: mockUserSession }
        })

        expect(postResponse.statusCode).toBe(302)
        expect(postResponse.headers.location).toBe('/queue-management')

        // Collect updated cookies from POST response
        const postSetCookie = postResponse.headers['set-cookie']
        const postCookies = Array.isArray(postSetCookie)
          ? postSetCookie
          : [postSetCookie].filter(Boolean)

        const updatedCookieHeader = postCookies.length
          ? postCookies.map((c) => c.split(';')[0]).join('; ')
          : cookieHeader

        // Follow redirect with the updated session cookie
        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/queue-management',
          headers: { cookie: updatedCookieHeader },
          auth: { strategy: 'session', credentials: mockUserSession }
        })

        expect(statusCode).toBe(statusCodes.ok)
        const $ = cheerio.load(result)
        expect(
          $('[data-module="govuk-notification-banner"]').length
        ).toBeGreaterThan(0)
      })

      test('Should render error state when backend call fails', async () => {
        stubDlqStatusError()

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/queue-management',
          auth: { strategy: 'session', credentials: mockUserSession }
        })

        expect(statusCode).toBe(statusCodes.internalServerError)
        expect(result).toContain('Sorry, there is a problem with the service')
      })
    })
  })

  describe('GET /queue-management/confirm-clear', () => {
    describe('When user is unauthenticated', () => {
      test('Should return unauthorised status code', async () => {
        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/queue-management/confirm-clear'
        })

        expect(statusCode).toBe(statusCodes.unauthorised)
        expect(result).toContain('Unauthorised')
      })
    })

    describe('When user is authenticated', () => {
      beforeEach(() => {
        getUserSession.mockReturnValue(mockUserSession)
      })

      test('Should return OK and render confirmation page', async () => {
        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/queue-management/confirm-clear',
          auth: { strategy: 'session', credentials: mockUserSession }
        })

        expect(statusCode).toBe(statusCodes.ok)

        const $ = cheerio.load(result)
        expect($('h1').text()).toContain('Confirm')
        expect(result).toContain('/queue-management/clear')
      })
    })
  })

  describe('POST /queue-management/clear', () => {
    describe('When user is unauthenticated', () => {
      test('Should return unauthorised status code', async () => {
        const { result, statusCode } = await server.inject({
          method: 'POST',
          url: '/queue-management/clear',
          payload: {}
        })

        expect(statusCode).toBe(statusCodes.unauthorised)
        expect(result).toContain('Unauthorised')
      })
    })

    describe('When user is authenticated', () => {
      beforeEach(() => {
        getUserSession.mockReturnValue(mockUserSession)
      })

      test('Should call backend purge and redirect to /queue-management', async () => {
        stubDlqPurge()

        const { cookie, crumb } = await getCsrfToken(
          server,
          '/queue-management/confirm-clear',
          { strategy: 'session', credentials: mockUserSession }
        )

        const { statusCode, headers } = await server.inject({
          method: 'POST',
          url: '/queue-management/clear',
          headers: { cookie },
          payload: { crumb },
          auth: { strategy: 'session', credentials: mockUserSession }
        })

        expect(statusCode).toBe(302)
        expect(headers.location).toBe('/queue-management')
      })

      test('Should handle backend error gracefully and redirect', async () => {
        stubDlqPurgeError()

        const { cookie, crumb } = await getCsrfToken(
          server,
          '/queue-management/confirm-clear',
          { strategy: 'session', credentials: mockUserSession }
        )

        const { statusCode, headers } = await server.inject({
          method: 'POST',
          url: '/queue-management/clear',
          headers: { cookie },
          payload: { crumb },
          auth: { strategy: 'session', credentials: mockUserSession }
        })

        expect(statusCode).toBe(302)
        expect(headers.location).toBe('/queue-management')
      })
    })
  })
})
