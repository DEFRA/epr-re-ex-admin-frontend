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

describe('GET summary log document', () => {
  const organisationId = '69c3b4f0abda9efa68dd6697'
  const registrationId = '69c3b4f0abda9efa68dd669b'
  const summaryLogId = 'sl-123'
  const url = `/organisations/${organisationId}/registrations/${registrationId}/summary-logs/${summaryLogId}`
  const documentPath = `/v1/organisations/${organisationId}/registrations/${registrationId}/summary-logs/${summaryLogId}/document`

  let server

  const summaryLogDocument = {
    version: 3,
    summaryLogId,
    status: 'submitted',
    uploadedAt: '2026-01-01T11:00:00.000Z',
    processingType: 'reprocessor',
    loadsByReportingPeriod: [
      {
        reportingPeriod: '2026-01',
        isOpen: true,
        loadsAdded: 4,
        balanceAffectingTonnage: 12.5
      }
    ]
  }

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

  const stubBackendDocument = (response) => {
    mswServer.use(
      http.get(`${config.get('eprBackendUrl')}${documentPath}`, () => response)
    )
  }

  const loadPage = async () => {
    const { result, statusCode } = await server.inject({
      method: 'GET',
      url,
      auth: { strategy: 'session', credentials: mockUserSession }
    })
    return { $: cheerio.load(result), statusCode }
  }

  describe('When user is unauthenticated', () => {
    test('Should return unauthorised status code and unauthorised view', async () => {
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url
      })

      expect(statusCode).toBe(statusCodes.unauthorised)
      expect(result).toEqual(expect.stringContaining('Unauthorised'))
    })
  })

  describe('When user is authenticated', () => {
    beforeEach(() => {
      vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
    })

    test('Should render the whole document as pretty-printed JSON', async () => {
      stubBackendDocument(HttpResponse.json(summaryLogDocument))

      const { $, statusCode } = await loadPage()

      expect(statusCode).toBe(statusCodes.ok)

      const dumped = $('.app-json-display').text()
      const parsed = JSON.parse(dumped)
      expect(parsed).toEqual(summaryLogDocument)
      expect(parsed.loadsByReportingPeriod).toHaveLength(1)
    })

    test('Should render an at-a-glance summary list of status, uploaded-at and processing type', async () => {
      stubBackendDocument(HttpResponse.json(summaryLogDocument))

      const { $, statusCode } = await loadPage()

      expect(statusCode).toBe(statusCodes.ok)

      const rowValue = (label) =>
        $('.govuk-summary-list__row')
          .filter((_, el) => $(el).find('dt').text().trim() === label)
          .find('dd.govuk-summary-list__value')
          .text()
          .trim()

      expect(rowValue('Status')).toBe('submitted')
      expect(rowValue('Uploaded at')).toBe('2026-01-01T11:00:00.000Z')
      expect(rowValue('Processing type')).toBe('reprocessor')
    })

    test('Should render a breadcrumb back to the registration overview', async () => {
      stubBackendDocument(HttpResponse.json(summaryLogDocument))

      const { $, statusCode } = await loadPage()

      expect(statusCode).toBe(statusCodes.ok)

      const overviewCrumb = $(
        `.govuk-breadcrumbs a[href="/organisations/${organisationId}/registrations/${registrationId}/overview"]`
      )
      expect(overviewCrumb).toHaveLength(1)
    })

    test('Should render a not-found message when the backend returns 404', async () => {
      stubBackendDocument(
        HttpResponse.json(
          { message: 'Not found' },
          { status: statusCodes.notFound }
        )
      )

      const { $, statusCode } = await loadPage()

      expect(statusCode).toBe(statusCodes.notFound)
      expect($.text()).toContain('Summary log not found')
    })

    test('Should show the service error page when the backend errors', async () => {
      stubBackendDocument(
        HttpResponse.json(
          { message: 'Server error' },
          { status: statusCodes.internalServerError }
        )
      )

      const { $, statusCode } = await loadPage()

      expect(statusCode).toBe(statusCodes.internalServerError)
      expect($.text()).toContain('Sorry, there is a problem with the service')
    })
  })
})
