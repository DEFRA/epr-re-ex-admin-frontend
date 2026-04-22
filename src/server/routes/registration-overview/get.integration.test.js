import { config } from '#config/config.js'
import { statusCodes } from '#server/common/constants/status-codes.js'
import { getUserSession } from '#server/common/helpers/auth/get-user-session.js'
import { mockUserSession } from '#server/common/test-helpers/fixtures.js'
import { createMockOidcServer } from '#server/common/test-helpers/mock-oidc.js'
import { createServer } from '#server/server.js'
import { vi } from 'vitest'
import { http, HttpResponse, server as mswServer } from '#vite/setup-msw.js'
import * as cheerio from 'cheerio'

vi.mock('#server/common/helpers/auth/get-user-session.js', () => ({
  getUserSession: vi.fn().mockReturnValue(null)
}))

describe('#registrationOverviewController', () => {
  const originalBackendUrl = config.get('eprBackendUrl')
  const backendUrl = 'http://mock-backend'
  const organisationId = '69c3b4f0abda9efa68dd6697'
  const registrationId = '69c3b4f0abda9efa68dd669b'
  const url = `/organisations/${organisationId}/registrations/${registrationId}/overview`
  let server

  beforeAll(async () => {
    config.set('eprBackendUrl', backendUrl)
    createMockOidcServer()
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    config.set('eprBackendUrl', originalBackendUrl)
    await server.stop({ timeout: 0 })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const mockRegistration = {
    id: registrationId,
    registrationNumber: 'REG-50030-001',
    status: 'approved',
    processingType: 'reprocessing',
    material: 'glass',
    site: 'Site A',
    accreditation: {
      id: '69c3b4f0abda9efa68dd6698',
      accreditationNumber: 'ACC-50030-001',
      status: 'approved'
    }
  }

  const mockOverview = {
    id: organisationId,
    companyName: 'ACME ltd',
    registrations: [mockRegistration]
  }

  const mockCalendar = {
    cadence: 'monthly',
    reportingPeriods: [
      {
        year: 2026,
        period: 1,
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        dueDate: '2026-02-20',
        report: {
          id: 'b41148de-8a76-4214-b68d-4b786400fb90',
          status: 'ready_to_submit',
          submissionNumber: 1
        }
      },
      {
        year: 2026,
        period: 2,
        startDate: '2026-02-01',
        endDate: '2026-02-28',
        dueDate: '2026-03-20',
        report: null
      }
    ]
  }

  const useMockBackend = (
    overviewResponse = mockOverview,
    calendarResponse = mockCalendar
  ) => {
    mswServer.use(
      http.get(
        `${backendUrl}/v1/organisations/${organisationId}/overview`,
        () => HttpResponse.json(overviewResponse)
      ),
      http.get(
        `${backendUrl}/v1/organisations/${organisationId}/registrations/${registrationId}/reports/calendar`,
        () => HttpResponse.json(calendarResponse)
      )
    )
  }

  describe('When user is unauthenticated', () => {
    test('Should return unauthorised status code', async () => {
      const { statusCode } = await server.inject({ method: 'GET', url })

      expect(statusCode).toBe(statusCodes.unauthorised)
    })
  })

  describe('When user is authenticated', () => {
    beforeAll(() => {
      getUserSession.mockReturnValue(mockUserSession)
    })

    test('Should return OK', async () => {
      useMockBackend()

      const { statusCode } = await server.inject({
        method: 'GET',
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      expect(statusCode).toBe(statusCodes.ok)
    })

    test('Should render the company name and registration number as heading', async () => {
      useMockBackend()

      const { result } = await server.inject({
        method: 'GET',
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      const $ = cheerio.load(result)
      expect($('h1').text().trim()).toEqual('ACME ltd - REG-50030-001')
    })

    test('Should fall back to registration id in heading when registrationNumber is missing', async () => {
      useMockBackend({
        ...mockOverview,
        registrations: [{ ...mockRegistration, registrationNumber: undefined }]
      })

      const { result } = await server.inject({
        method: 'GET',
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      const $ = cheerio.load(result)
      expect($('h1').text().trim()).toEqual(`ACME ltd - ${registrationId}`)
    })

    test('Should render breadcrumbs for Organisations and Overview', async () => {
      useMockBackend()

      const { result } = await server.inject({
        method: 'GET',
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      const $ = cheerio.load(result)
      const breadcrumbLinks = $('.govuk-breadcrumbs__link')
      expect(breadcrumbLinks).toHaveLength(2)
      expect($(breadcrumbLinks[0]).text()).toEqual('Organisations')
      expect($(breadcrumbLinks[0]).attr('href')).toEqual('/organisations')
      expect($(breadcrumbLinks[1]).text()).toEqual('Overview')
      expect($(breadcrumbLinks[1]).attr('href')).toEqual(
        `/organisations/${organisationId}/overview`
      )
    })

    test('Should render summary list with status, processing type, material and site', async () => {
      useMockBackend()

      const { result } = await server.inject({
        method: 'GET',
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      const $ = cheerio.load(result)
      const keys = $('.govuk-summary-list__key')
      const values = $('.govuk-summary-list__value')

      expect($(keys[0]).text().trim()).toEqual('Status')
      expect($(values[0]).find('strong.govuk-tag').text().trim()).toEqual(
        'approved'
      )
      expect($(keys[1]).text().trim()).toEqual('Processing type')
      expect($(values[1]).text().trim()).toEqual('reprocessing')
      expect($(keys[2]).text().trim()).toEqual('Material')
      expect($(values[2]).text().trim()).toEqual('glass')
      expect($(keys[3]).text().trim()).toEqual('Site')
      expect($(values[3]).text().trim()).toEqual('Site A')
    })

    test('Should render accreditation rows in summary list when accreditation exists', async () => {
      useMockBackend()

      const { result } = await server.inject({
        method: 'GET',
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      const $ = cheerio.load(result)
      const keys = $('.govuk-summary-list__key')
      const values = $('.govuk-summary-list__value')

      expect($(keys[4]).text().trim()).toEqual('Accreditation number')
      expect($(values[4]).text().trim()).toEqual('ACC-50030-001')
      expect($(keys[5]).text().trim()).toEqual('Accreditation status')
      expect($(values[5]).find('strong.govuk-tag').text().trim()).toEqual(
        'approved'
      )
    })

    test('Should not render accreditation rows in summary list when accreditation is absent', async () => {
      useMockBackend({
        ...mockOverview,
        registrations: [{ ...mockRegistration, accreditation: null }]
      })

      const { result } = await server.inject({
        method: 'GET',
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      const $ = cheerio.load(result)
      const keys = $('.govuk-summary-list__key')
      const keyTexts = keys.map((_, el) => $(el).text().trim()).get()

      expect(keyTexts).not.toContain('Accreditation number')
      expect(keyTexts).not.toContain('Accreditation status')
    })

    test('Should render the reporting periods table', async () => {
      useMockBackend()

      const { result } = await server.inject({
        method: 'GET',
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      const $ = cheerio.load(result)
      const headers = $('table thead tr th')
      expect($(headers[0]).text()).toEqual('Start')
      expect($(headers[1]).text()).toEqual('End')
      expect($(headers[2]).text()).toEqual('Due')
      expect($(headers[3]).text()).toEqual('Status')
      expect($(headers[4]).text()).toEqual('Actions')

      const rows = $('table tbody tr')
      expect(rows).toHaveLength(2)

      const firstRowCells = $(rows[0]).find('td')
      expect($(firstRowCells[0]).text().trim()).toEqual('2026-01-01')
      expect($(firstRowCells[1]).text().trim()).toEqual('2026-01-31')
      expect($(firstRowCells[2]).text().trim()).toEqual('2026-02-20')
      expect(
        $(firstRowCells[3]).find('strong.govuk-tag').text().trim()
      ).toEqual('ready_to_submit')
      const viewLink = $(firstRowCells[4]).find('a')
      expect(viewLink.text()).toEqual('View')
      expect(viewLink.attr('href')).toEqual(
        `/organisations/${organisationId}/registrations/${registrationId}/reports/2026/monthly/1`
      )

      const secondRowCells = $(rows[1]).find('td')
      expect(
        $(secondRowCells[3]).find('strong.govuk-tag').text().trim()
      ).toEqual('Due')
      expect($(secondRowCells[4]).find('a')).toHaveLength(0)
    })

    test('Should return 404 when registration is not found', async () => {
      useMockBackend({ ...mockOverview, registrations: [] })

      const { statusCode } = await server.inject({
        method: 'GET',
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      expect(statusCode).toBe(statusCodes.notFound)
    })

    test('Should show 500 error page when backend returns a non-OK response', async () => {
      mswServer.use(
        http.get(
          `${backendUrl}/v1/organisations/${organisationId}/overview`,
          () => {
            throw HttpResponse.text('', { status: 500 })
          }
        )
      )

      const { result } = await server.inject({
        method: 'GET',
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      expect(result).toEqual(
        expect.stringContaining('Sorry, there is a problem with the service')
      )
    })
  })
})
