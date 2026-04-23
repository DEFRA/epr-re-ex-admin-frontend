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

describe('POST /system-logs', () => {
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

  const stubBackendResponse = (response) => {
    const calls = []
    mswServer.use(
      http.post(
        `${config.get('eprBackendUrl')}/v1/system-logs/search`,
        async ({ request }) => {
          const body = await request.json()
          calls.push({ body })
          return response
        }
      )
    )
    return calls
  }

  const getCrumb = async () => {
    getUserSession.mockReturnValue(mockUserSession)
    const { result } = await server.inject({
      method: 'GET',
      url: '/system-logs',
      auth: {
        strategy: 'session',
        credentials: mockUserSession
      }
    })
    const $ = cheerio.load(result)
    return $('input[name="crumb"]').val()
  }

  describe('When user is unauthenticated', () => {
    test('Should return unauthorised status code', async () => {
      const { statusCode } = await server.inject({
        method: 'POST',
        url: '/system-logs',
        payload: { email: 'test@example.com' }
      })

      expect(statusCode).toBe(statusCodes.unauthorised)
    })
  })

  describe('When user is authenticated', () => {
    let crumb

    beforeEach(async () => {
      getUserSession.mockReturnValue(mockUserSession)
      crumb = await getCrumb()
    })

    const submitSearch = async (payload = {}) => {
      const { result, statusCode } = await server.inject({
        method: 'POST',
        url: '/system-logs',
        payload: { crumb, ...payload },
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        },
        headers: {
          cookie: `crumb=${crumb}`
        }
      })

      return { $: cheerio.load(result), statusCode }
    }

    describe('search filters', () => {
      test('passes email to backend when searching by email', async () => {
        const backendCalls = stubBackendResponse(
          HttpResponse.json({ systemLogs: [] })
        )

        await submitSearch({ email: 'alice@example.com' })

        expect(backendCalls).toHaveLength(1)
        expect(backendCalls[0].body).toEqual({ email: 'alice@example.com' })
      })

      test('passes subCategory to backend alongside email', async () => {
        const backendCalls = stubBackendResponse(
          HttpResponse.json({ systemLogs: [] })
        )

        await submitSearch({
          email: 'alice@example.com',
          subCategory: 'summary-log'
        })

        expect(backendCalls).toHaveLength(1)
        expect(backendCalls[0].body).toEqual({
          email: 'alice@example.com',
          subCategory: 'summary-log'
        })
      })

      test('passes organisationId to backend when searching by reference number', async () => {
        const backendCalls = stubBackendResponse(
          HttpResponse.json({ systemLogs: [] })
        )

        await submitSearch({ referenceNumber: 'ORG-123' })

        expect(backendCalls).toHaveLength(1)
        expect(backendCalls[0].body).toEqual({ organisationId: 'ORG-123' })
      })

      test('passes combined filters to backend', async () => {
        const backendCalls = stubBackendResponse(
          HttpResponse.json({ systemLogs: [] })
        )

        await submitSearch({
          referenceNumber: 'ORG-123',
          email: 'alice@example.com',
          subCategory: 'summary-log'
        })

        expect(backendCalls).toHaveLength(1)
        expect(backendCalls[0].body).toEqual({
          organisationId: 'ORG-123',
          email: 'alice@example.com',
          subCategory: 'summary-log'
        })
      })

      test('omits empty filter values from backend request', async () => {
        const backendCalls = stubBackendResponse(
          HttpResponse.json({ systemLogs: [] })
        )

        await submitSearch({
          referenceNumber: '',
          email: 'alice@example.com',
          subCategory: ''
        })

        expect(backendCalls).toHaveLength(1)
        expect(backendCalls[0].body).toEqual({ email: 'alice@example.com' })
      })
    })

    describe('validation', () => {
      test('shows error on both fields when no filters are provided', async () => {
        const { $, statusCode } = await submitSearch({
          referenceNumber: '',
          email: '',
          subCategory: ''
        })

        expect(statusCode).toBe(statusCodes.ok)
        expect($.text()).toContain('There is a problem')
        expect($.text()).toContain(
          'Enter an organisation reference number or email address'
        )
        expect($('#referenceNumber-error').text()).toContain(
          'Enter an organisation reference number or email address'
        )
        expect($('#email-error').text()).toContain(
          'Enter an organisation reference number or email address'
        )
      })

      test('shows error when only subCategory is provided', async () => {
        const { $, statusCode } = await submitSearch({
          referenceNumber: '',
          email: '',
          subCategory: 'summary-log'
        })

        expect(statusCode).toBe(statusCodes.ok)
        expect($.text()).toContain(
          'Enter an organisation reference number or email address'
        )
      })

      test('does not call backend when no filters are provided', async () => {
        const backendCalls = stubBackendResponse(
          HttpResponse.json({ systemLogs: [] })
        )

        await submitSearch({
          referenceNumber: '',
          email: '',
          subCategory: ''
        })

        expect(backendCalls).toHaveLength(0)
      })

      test('does not call backend when only subCategory is provided', async () => {
        const backendCalls = stubBackendResponse(
          HttpResponse.json({ systemLogs: [] })
        )

        await submitSearch({
          referenceNumber: '',
          email: '',
          subCategory: 'summary-log'
        })

        expect(backendCalls).toHaveLength(0)
      })
    })

    describe('form rendering', () => {
      test('renders form with POST method', async () => {
        const { result } = await server.inject({
          method: 'GET',
          url: '/system-logs',
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })
        const $ = cheerio.load(result)

        expect($('form.app-filters').attr('method')).toBe('post')
      })

      test('renders CSRF crumb hidden input', async () => {
        const { result } = await server.inject({
          method: 'GET',
          url: '/system-logs',
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })
        const $ = cheerio.load(result)

        expect($('input[name="crumb"]')).toHaveLength(1)
        expect($('input[name="crumb"]').attr('type')).toBe('hidden')
      })

      test('renders all three search fields', async () => {
        const { result } = await server.inject({
          method: 'GET',
          url: '/system-logs',
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })
        const $ = cheerio.load(result)

        expect($('input[name="referenceNumber"]')).toHaveLength(1)
        expect($('input[name="email"]')).toHaveLength(1)
        expect($('select[name="subCategory"]')).toHaveLength(1)
      })

      test('renders event type dropdown with expected options', async () => {
        const { result } = await server.inject({
          method: 'GET',
          url: '/system-logs',
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })
        const $ = cheerio.load(result)
        const options = $('select[name="subCategory"] option')
          .map((_, el) => $(el).val())
          .get()

        expect(options).toEqual([
          '',
          'download',
          'epr-organisations',
          'overseas-sites',
          'packaging-recycling-notes',
          'reports',
          'summary-log',
          'waste-balance'
        ])
      })

      test('preserves search values in form after search', async () => {
        stubBackendResponse(
          HttpResponse.json({
            systemLogs: [
              {
                createdBy: { email: 'alice@example.com' },
                event: {
                  category: 'entity',
                  subCategory: 'summary-log',
                  action: 'create'
                },
                context: {}
              }
            ]
          })
        )

        const { $ } = await submitSearch({
          referenceNumber: 'ORG-123',
          email: 'alice@example.com',
          subCategory: 'summary-log'
        })

        expect($('input[name="referenceNumber"]').val()).toBe('ORG-123')
        expect($('input[name="email"]').val()).toBe('alice@example.com')
        expect($('select[name="subCategory"] option[selected]').val()).toBe(
          'summary-log'
        )
      })

      test('clear search link resets all filters', async () => {
        const { result } = await server.inject({
          method: 'GET',
          url: '/system-logs',
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })
        const $ = cheerio.load(result)
        const clearLink = $('a.govuk-button--inverse')

        expect(clearLink.attr('href')).toBe('/system-logs')
      })
    })

    describe('results rendering', () => {
      test('renders system logs returned from backend', async () => {
        stubBackendResponse(
          HttpResponse.json({
            systemLogs: [
              {
                createdAt: '2025-03-15T10:00:00Z',
                createdBy: { email: 'alice@example.com' },
                event: {
                  category: 'entity',
                  subCategory: 'epr-organisations',
                  action: 'create'
                },
                context: {}
              }
            ]
          })
        )

        const { $, statusCode } = await submitSearch({
          email: 'alice@example.com'
        })

        expect(statusCode).toBe(statusCodes.ok)
        expect($('.govuk-summary-card')).toHaveLength(1)
        expect($('.govuk-summary-card__title').text().trim()).toBe(
          'entity, epr-organisations, create'
        )
      })

      test('shows empty state when no logs match', async () => {
        stubBackendResponse(HttpResponse.json({ systemLogs: [] }))

        const { $ } = await submitSearch({ email: 'nobody@example.com' })

        expect($('.govuk-summary-card')).toHaveLength(0)
        expect($.text()).toContain('No system logs found')
      })
    })

    describe('error handling', () => {
      test('renders error page when backend returns server error', async () => {
        stubBackendResponse(
          HttpResponse.json(
            { error: 'Server error' },
            { status: statusCodes.internalServerError }
          )
        )

        const { statusCode } = await submitSearch({
          email: 'test@example.com'
        })

        expect(statusCode).toBe(statusCodes.internalServerError)
      })
    })
  })
})
