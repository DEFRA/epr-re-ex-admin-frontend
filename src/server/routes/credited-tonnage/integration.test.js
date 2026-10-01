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

describe('credited-tonnage', () => {
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
      http.get(`${backendUrl}/v1/admin/waste-balances/credited-tonnage`, () => {
        return HttpResponse.json(data, { status })
      })
    )
  }

  const mockCreditedTonnage = {
    meta: { generatedAt: '2026-07-16T14:30:00.000Z' },
    data: [
      {
        month: '2026-01',
        organisation: { id: '0000-0000-uuid', reference: '500001' },
        accreditation: {
          id: '1111-1111-uuid',
          accreditationNumber: 'ACC-456',
          processingType: 'reprocessor',
          material: 'plastic'
        },
        tonnage: {
          totalCredited: 1000,
          eligibleForWasteBalance: 900,
          sentOnDeductions: 50
        }
      }
    ]
  }

  describe('GET /credited-tonnage', () => {
    describe('When user is unauthenticated', () => {
      beforeEach(() => {
        vi.mocked(getUserSession).mockResolvedValue(null)
      })

      test('Should return unauthorised status code', async () => {
        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/credited-tonnage'
        })

        expect(statusCode).toBe(statusCodes.unauthorised)
        expect(result).toEqual(expect.stringContaining('Unauthorised'))
      })
    })

    describe('When user is authenticated', () => {
      beforeEach(() => {
        vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
      })

      test('Should render the heading and generated-at line', async () => {
        stubBackendResponse(mockCreditedTonnage)

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/credited-tonnage',
          auth: { strategy: 'session', credentials: mockUserSession }
        })

        expect(statusCode).toBe(statusCodes.ok)

        const $ = cheerio.load(result)
        expect($('h1').text()).toContain('Tonnage credited to waste balances')
        expect($('.govuk-body').text()).toContain('Data generated at:')
      })

      test('Should render the organisation reference, not the internal id', async () => {
        stubBackendResponse(mockCreditedTonnage)

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/credited-tonnage',
          auth: { strategy: 'session', credentials: mockUserSession }
        })

        expect(statusCode).toBe(statusCodes.ok)

        const $ = cheerio.load(result)
        const tableText = $('.govuk-table').text()
        expect(tableText).toContain('500001')
        expect(tableText).not.toContain('0000-0000-uuid')
        expect(tableText).toContain('January 2026')
        expect(tableText).toContain('Plastic')
        expect(tableText).toContain('1,000.00')
      })

      test('Should align numeric cells', async () => {
        stubBackendResponse(mockCreditedTonnage)

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/credited-tonnage',
          auth: { strategy: 'session', credentials: mockUserSession }
        })

        expect(statusCode).toBe(statusCodes.ok)

        const $ = cheerio.load(result)
        expect($('.govuk-table__cell--numeric').length).toBeGreaterThan(0)
      })

      test('Should render table headers only for an empty dataset', async () => {
        stubBackendResponse({
          meta: { generatedAt: '2026-07-16T12:00:00.000Z' },
          data: []
        })

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/credited-tonnage',
          auth: { strategy: 'session', credentials: mockUserSession }
        })

        expect(statusCode).toBe(statusCodes.ok)

        const $ = cheerio.load(result)
        expect($('.govuk-table thead th').length).toBe(8)
        expect($('.govuk-table tbody tr').length).toBe(0)
      })

      test('Should render the download form with a crumb', async () => {
        stubBackendResponse(mockCreditedTonnage)

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/credited-tonnage',
          auth: { strategy: 'session', credentials: mockUserSession }
        })

        expect(statusCode).toBe(statusCodes.ok)

        const $ = cheerio.load(result)
        const crumbInput = $(
          'form[action="/credited-tonnage"] input[name="crumb"]'
        )
        expect(crumbInput.length).toBe(1)
        expect(crumbInput.attr('value')).toBeTruthy()
        expect($('button.govuk-button').text().trim()).toBe('Download CSV')
      })

      test('Should have a navigation item for credited tonnage', async () => {
        stubBackendResponse(mockCreditedTonnage)

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/credited-tonnage',
          auth: { strategy: 'session', credentials: mockUserSession }
        })

        expect(statusCode).toBe(statusCodes.ok)

        const $ = cheerio.load(result)
        expect($('a[href="/credited-tonnage"]').length).toBeGreaterThan(0)
      })

      test('Should return server error when backend fails', async () => {
        stubBackendResponse(
          { error: 'Server error' },
          statusCodes.internalServerError
        )

        const { statusCode, result } = await server.inject({
          method: 'GET',
          url: '/credited-tonnage',
          auth: { strategy: 'session', credentials: mockUserSession }
        })

        expect(statusCode).toBe(statusCodes.internalServerError)
        expect(result).toContain('Sorry, there is a problem with the service')
      })
    })
  })

  describe('POST /credited-tonnage', () => {
    describe('When user is unauthenticated', () => {
      beforeEach(() => {
        vi.mocked(getUserSession).mockResolvedValue(null)
      })

      test('Should return unauthorised status code', async () => {
        const { result, statusCode } = await server.inject({
          method: 'POST',
          url: '/credited-tonnage',
          payload: {}
        })

        expect(statusCode).toBe(statusCodes.unauthorised)
        expect(result).toEqual(expect.stringContaining('Unauthorised'))
      })
    })

    describe('When user is authenticated', () => {
      beforeEach(() => {
        vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
      })

      test('Should return the CSV with a timestamped filename', async () => {
        stubBackendResponse(mockCreditedTonnage)

        const { cookie, crumb } = await getCsrfToken(
          server,
          '/credited-tonnage',
          { strategy: 'session', credentials: mockUserSession }
        )

        const { statusCode, headers, payload } = await server.inject({
          method: 'POST',
          url: '/credited-tonnage',
          headers: { cookie },
          payload: { crumb },
          auth: { strategy: 'session', credentials: mockUserSession }
        })

        expect(statusCode).toBe(statusCodes.ok)
        expect(headers['content-type']).toContain('text/csv')
        expect(headers['content-disposition']).toBe(
          'attachment; filename="credited-tonnage-2026-07-16T14-30-00Z.csv"'
        )
        expect(payload).toContain(
          'month,organisation_id,accreditation_number,material,processing_type,total_credited,eligible_for_waste_balance,sent_on_deductions'
        )
        expect(payload).toContain(
          '2026-01,500001,ACC-456,plastic,reprocessor,1000.00,900.00,50.00'
        )
      })

      test('Should download a header-only CSV for an empty dataset', async () => {
        stubBackendResponse({
          meta: { generatedAt: '2026-07-16T12:00:00.000Z' },
          data: []
        })

        const { cookie, crumb } = await getCsrfToken(
          server,
          '/credited-tonnage',
          { strategy: 'session', credentials: mockUserSession }
        )

        const { statusCode, payload } = await server.inject({
          method: 'POST',
          url: '/credited-tonnage',
          headers: { cookie },
          payload: { crumb },
          auth: { strategy: 'session', credentials: mockUserSession }
        })

        expect(statusCode).toBe(statusCodes.ok)
        const lines = payload.split(/\r?\n/).filter((line) => line.length > 0)
        expect(lines).toHaveLength(1)
        expect(lines[0]).toBe(
          'month,organisation_id,accreditation_number,material,processing_type,total_credited,eligible_for_waste_balance,sent_on_deductions'
        )
      })

      test('Should redirect back and surface the flashed error on the page', async () => {
        // The POST is the second backend call: the getCsrfToken GET succeeds,
        // the POST fails (flashing the error), and the follow-up GET succeeds
        // so the page can render the flash.
        let backendCall = 0
        mswServer.use(
          http.get(
            `${backendUrl}/v1/admin/waste-balances/credited-tonnage`,
            () => {
              backendCall += 1
              if (backendCall === 2) {
                return HttpResponse.json(
                  { message: 'Server error' },
                  { status: statusCodes.internalServerError }
                )
              }
              return HttpResponse.json(mockCreditedTonnage)
            }
          )
        )

        const { cookie, crumb } = await getCsrfToken(
          server,
          '/credited-tonnage',
          { strategy: 'session', credentials: mockUserSession }
        )

        const { statusCode, headers } = await server.inject({
          method: 'POST',
          url: '/credited-tonnage',
          headers: { cookie },
          payload: { crumb },
          auth: { strategy: 'session', credentials: mockUserSession }
        })

        expect(statusCode).toBe(statusCodes.found)
        expect(headers.location).toBe('/credited-tonnage')

        const setCookie = headers['set-cookie']
        const flashedCookie = (
          Array.isArray(setCookie) ? setCookie : [setCookie]
        )
          .map((c) => c.split(';')[0])
          .join('; ')

        const followUp = await server.inject({
          method: 'GET',
          url: '/credited-tonnage',
          headers: { cookie: flashedCookie },
          auth: { strategy: 'session', credentials: mockUserSession }
        })

        expect(followUp.statusCode).toBe(statusCodes.ok)
        const $ = cheerio.load(followUp.result)
        expect($('.govuk-error-summary').text()).toContain('Server error')
      })

      test('Should reject a request without a CSRF token', async () => {
        stubBackendResponse(mockCreditedTonnage)

        const { statusCode } = await server.inject({
          method: 'POST',
          url: '/credited-tonnage',
          payload: {},
          auth: { strategy: 'session', credentials: mockUserSession }
        })

        expect(statusCode).toBe(statusCodes.forbidden)
      })
    })
  })
})
