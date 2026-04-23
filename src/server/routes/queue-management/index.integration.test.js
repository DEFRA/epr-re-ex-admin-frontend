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

  const sampleMessages = [
    {
      messageId: 'abc-123',
      sentTimestamp: '2026-04-21T10:30:00.000Z',
      approximateReceiveCount: 4,
      command: {
        type: 'SUMMARY_LOG_COMMAND.VALIDATE',
        payload: { summaryLogId: 'log-001' }
      },
      body: '{"type":"SUMMARY_LOG_COMMAND.VALIDATE","payload":{"summaryLogId":"log-001"}}'
    },
    {
      messageId: 'def-456',
      sentTimestamp: '2026-04-20T08:15:00.000Z',
      approximateReceiveCount: 1,
      command: null,
      body: 'not valid json'
    }
  ]

  const stubDlqMessages = (messages, { omitMessagesField = false } = {}) => {
    mswServer.use(
      http.get(`${backendUrl}/v1/admin/queues/dlq/messages`, () =>
        HttpResponse.json(
          omitMessagesField
            ? { approximateMessageCount: 0 }
            : { approximateMessageCount: messages.length, messages }
        )
      )
    )
  }

  const stubDlqMessagesError = () => {
    mswServer.use(
      http.get(`${backendUrl}/v1/admin/queues/dlq/messages`, () =>
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
        stubDlqMessages(sampleMessages)

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/queue-management',
          auth: { strategy: 'session', credentials: mockUserSession }
        })

        expect(statusCode).toBe(statusCodes.ok)

        const $ = cheerio.load(result)
        expect($('h1').text()).toContain('Queue management')
        expect(result).toContain('2')
      })

      test('Should render table with correct columns and data', async () => {
        stubDlqMessages(sampleMessages)

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/queue-management',
          auth: { strategy: 'session', credentials: mockUserSession }
        })

        expect(statusCode).toBe(statusCodes.ok)

        const $ = cheerio.load(result)

        // Check table headers
        const headers = $('thead th')
          .map((_, el) => $(el).text().trim())
          .get()
        expect(headers).toEqual([
          'Command type',
          'Sent timestamp',
          'Receive count',
          'Raw message'
        ])

        // Check first row data
        const firstRowCells = $('tbody tr')
          .first()
          .find('td')
          .map((_, el) => $(el).text().trim())
          .get()
        expect(firstRowCells[0]).toBe('SUMMARY_LOG_COMMAND.VALIDATE')
        expect(firstRowCells[2]).toBe('4')

        // Check second row has "Unknown" for null command
        const secondRowCells = $('tbody tr')
          .eq(1)
          .find('td')
          .map((_, el) => $(el).text().trim())
          .get()
        expect(secondRowCells[0]).toBe('Unknown')
      })

      test('Should render details expander with raw JSON body', async () => {
        stubDlqMessages(sampleMessages)

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/queue-management',
          auth: { strategy: 'session', credentials: mockUserSession }
        })

        expect(statusCode).toBe(statusCodes.ok)

        const $ = cheerio.load(result)

        // Each message should have a details component
        const details = $('details.govuk-details')
        expect(details.length).toBe(2)

        // The first details component should contain the raw JSON body
        const firstDetailsContent = details.first().find('code').text().trim()
        expect(firstDetailsContent).toContain('SUMMARY_LOG_COMMAND.VALIDATE')
        expect(firstDetailsContent).toContain('log-001')
      })

      test('Should render empty state when no messages', async () => {
        stubDlqMessages([])

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/queue-management',
          auth: { strategy: 'session', credentials: mockUserSession }
        })

        expect(statusCode).toBe(statusCodes.ok)

        const $ = cheerio.load(result)
        expect(result).toContain(
          'There are no messages on the dead-letter queue.'
        )
        // No table should be rendered
        expect($('table').length).toBe(0)
      })

      test('Should handle missing messages field gracefully', async () => {
        stubDlqMessages([], { omitMessagesField: true })

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/queue-management',
          auth: { strategy: 'session', credentials: mockUserSession }
        })

        expect(statusCode).toBe(statusCodes.ok)
        expect(result).toContain(
          'There are no messages on the dead-letter queue.'
        )
      })

      test('Should render success banner after a successful purge redirect', async () => {
        stubDlqMessages([])
        stubDlqPurge()

        const { cookie, crumb } = await getCsrfToken(
          server,
          '/queue-management/confirm-clear',
          { strategy: 'session', credentials: mockUserSession }
        )

        const postResponse = await server.inject({
          method: 'POST',
          url: '/queue-management/clear',
          headers: { cookie },
          payload: { crumb },
          auth: { strategy: 'session', credentials: mockUserSession }
        })

        expect(postResponse.statusCode).toBe(302)

        // Follow redirect with the updated session cookie
        const postCookies = [postResponse.headers['set-cookie']]
          .flat()
          .filter(Boolean)
        const redirectCookie = postCookies.length
          ? postCookies.map((c) => c.split(';')[0]).join('; ')
          : cookie

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/queue-management',
          headers: { cookie: redirectCookie },
          auth: { strategy: 'session', credentials: mockUserSession }
        })

        expect(statusCode).toBe(statusCodes.ok)
        const $ = cheerio.load(result)
        expect(
          $('[data-module="govuk-notification-banner"]').length
        ).toBeGreaterThan(0)
      })

      test('Should render error state when backend call fails', async () => {
        stubDlqMessagesError()

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
