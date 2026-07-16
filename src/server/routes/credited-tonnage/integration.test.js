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
          deductibleFromCredited: 50
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
})
