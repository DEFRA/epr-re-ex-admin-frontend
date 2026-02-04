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

describe('tonnage-monitoring', () => {
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

  const stubBackendResponse = (data, status = 200) => {
    mswServer.use(
      http.get(`${backendUrl}/v1/tonnage-monitoring`, () => {
        return HttpResponse.json(data, { status })
      })
    )
  }

  const mockTonnageData = {
    generatedAt: '2026-01-29T14:30:00.000Z',
    materials: [
      { material: 'aluminium', totalTonnage: 1234.56 },
      { material: 'glass_re_melt', totalTonnage: 5678.9 }
    ],
    total: 6913.46
  }

  describe('GET /tonnage-monitoring', () => {
    describe('When user is unauthenticated', () => {
      beforeEach(() => {
        getUserSession.mockReturnValue(null)
      })

      test('Should return unauthorised status code', async () => {
        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/tonnage-monitoring'
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
        stubBackendResponse(mockTonnageData)

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/tonnage-monitoring',
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })

        expect(statusCode).toBe(statusCodes.ok)

        const $ = cheerio.load(result)
        expect($('h1').text()).toContain('Tonnage monitoring')
      })

      test('Should render page with description text', async () => {
        stubBackendResponse(mockTonnageData)

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/tonnage-monitoring',
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })

        expect(statusCode).toBe(statusCodes.ok)

        const $ = cheerio.load(result)
        expect($('.govuk-body').text()).toContain(
          'Cumulative total of incoming tonnage'
        )
      })

      test('Should render materials table with formatted data', async () => {
        stubBackendResponse(mockTonnageData)

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/tonnage-monitoring',
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })

        expect(statusCode).toBe(statusCodes.ok)

        const $ = cheerio.load(result)
        const tableText = $('.govuk-table').text()
        expect(tableText).toContain('Aluminium')
        expect(tableText).toContain('1234.56')
        expect(tableText).toContain('Glass re-melt')
        expect(tableText).toContain('5678.90')
        expect(tableText).toContain('Total')
        expect(tableText).toContain('6913.46')
      })

      test('Should render generated at timestamp', async () => {
        stubBackendResponse(mockTonnageData)

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/tonnage-monitoring',
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })

        expect(statusCode).toBe(statusCodes.ok)

        const $ = cheerio.load(result)
        expect($('.govuk-body').text()).toContain('Data generated at:')
      })

      test('Should render download button', async () => {
        stubBackendResponse(mockTonnageData)

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/tonnage-monitoring',
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })

        expect(statusCode).toBe(statusCodes.ok)

        const $ = cheerio.load(result)
        expect($('button.govuk-button').text().trim()).toBe('Download CSV')
      })

      test('Should render inset text when no materials', async () => {
        stubBackendResponse({
          generatedAt: '2026-01-29T12:00:00.000Z',
          materials: [],
          total: 0
        })

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/tonnage-monitoring',
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })

        expect(statusCode).toBe(statusCodes.ok)

        const $ = cheerio.load(result)
        expect($('.govuk-inset-text').text()).toContain(
          'No tonnage data available'
        )
      })

      test('Should have navigation item for tonnage monitoring', async () => {
        stubBackendResponse(mockTonnageData)

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/tonnage-monitoring',
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })

        expect(statusCode).toBe(statusCodes.ok)

        const $ = cheerio.load(result)
        const navLink = $('a[href="/tonnage-monitoring"]')
        expect(navLink.length).toBeGreaterThan(0)
      })

      test('Should return server error when backend fails', async () => {
        stubBackendResponse(
          { error: 'Server error' },
          statusCodes.internalServerError
        )

        const { statusCode, result } = await server.inject({
          method: 'GET',
          url: '/tonnage-monitoring',
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })

        expect(statusCode).toBe(statusCodes.internalServerError)
        expect(result).toContain('Sorry, there is a problem with the service')
      })
    })
  })

  describe('POST /tonnage-monitoring', () => {
    describe('When user is unauthenticated', () => {
      beforeEach(() => {
        getUserSession.mockReturnValue(null)
      })

      test('Should return unauthorised status code', async () => {
        const { result, statusCode } = await server.inject({
          method: 'POST',
          url: '/tonnage-monitoring',
          payload: {}
        })

        expect(statusCode).toBe(statusCodes.unauthorised)
        expect(result).toEqual(expect.stringContaining('Unauthorised'))
      })
    })

    describe('When user is authenticated', () => {
      beforeEach(() => {
        getUserSession.mockReturnValue(mockUserSession)
      })

      test('Should return CSV file on successful request', async () => {
        stubBackendResponse(mockTonnageData)

        const { cookie, crumb } = await getCsrfToken(
          server,
          '/tonnage-monitoring',
          { strategy: 'session', credentials: mockUserSession }
        )

        const { statusCode, headers, payload } = await server.inject({
          method: 'POST',
          url: '/tonnage-monitoring',
          headers: { cookie },
          payload: { crumb },
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })

        expect(statusCode).toBe(statusCodes.ok)
        expect(headers['content-type']).toContain('text/csv')
        expect(headers['content-disposition']).toBe(
          'attachment; filename="tonnage-monitoring.csv"'
        )
        expect(payload).toContain('Tonnage by material')
        expect(payload).toContain('Aluminium,1234.56')
        expect(payload).toContain('Glass re-melt,5678.90')
        expect(payload).toContain('Total,6913.46')
      })

      test('Should include formatted date in CSV', async () => {
        stubBackendResponse(mockTonnageData)

        const { cookie, crumb } = await getCsrfToken(
          server,
          '/tonnage-monitoring',
          { strategy: 'session', credentials: mockUserSession }
        )

        const { payload } = await server.inject({
          method: 'POST',
          url: '/tonnage-monitoring',
          headers: { cookie },
          payload: { crumb },
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })

        expect(payload).toContain(
          'Data generated at: 29 January 2026 at 2:30pm'
        )
      })

      test('Should include description in CSV', async () => {
        stubBackendResponse(mockTonnageData)

        const { cookie, crumb } = await getCsrfToken(
          server,
          '/tonnage-monitoring',
          { strategy: 'session', credentials: mockUserSession }
        )

        const { payload } = await server.inject({
          method: 'POST',
          url: '/tonnage-monitoring',
          headers: { cookie },
          payload: { crumb },
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })

        expect(payload).toContain(
          'Cumulative total of incoming tonnage, excluding any PRN or sent-on deductions'
        )
      })

      test('Should redirect back to GET with error on backend failure', async () => {
        stubBackendResponse({ message: 'Server error' }, 500)

        const { cookie, crumb } = await getCsrfToken(
          server,
          '/tonnage-monitoring',
          { strategy: 'session', credentials: mockUserSession }
        )

        const { statusCode, headers } = await server.inject({
          method: 'POST',
          url: '/tonnage-monitoring',
          headers: { cookie },
          payload: { crumb },
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })

        expect(statusCode).toBe(302)
        expect(headers.location).toBe('/tonnage-monitoring')
      })

      test('Should reject request without CSRF token', async () => {
        stubBackendResponse(mockTonnageData)

        const { statusCode } = await server.inject({
          method: 'POST',
          url: '/tonnage-monitoring',
          payload: {},
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })

        expect(statusCode).toBe(statusCodes.forbidden)
      })
    })
  })
})
