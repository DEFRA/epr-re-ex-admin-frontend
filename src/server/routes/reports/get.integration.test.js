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

describe('#reportDetailController', () => {
  const originalBackendUrl = config.get('eprBackendUrl')
  const backendUrl = 'http://mock-backend'
  const organisationId = '69c3b4f0abda9efa68dd6697'
  const registrationId = '69c3b4f0abda9efa68dd669b'
  const year = '2026'
  const cadence = 'monthly'
  const period = '1'
  const url = `/organisations/${organisationId}/registrations/${registrationId}/reports/${year}/${cadence}/${period}`
  const backendReportUrl = `/v1/organisations/${organisationId}/registrations/${registrationId}/reports/${year}/${cadence}/${period}`
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

  const mockReport = {
    id: 'b41148de-8a76-4214-b68d-4b786400fb90',
    status: 'ready_to_submit',
    submissionNumber: 1
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
      mswServer.use(
        http.get(`${backendUrl}${backendReportUrl}`, () =>
          HttpResponse.json(mockReport)
        )
      )

      const { statusCode } = await server.inject({
        method: 'GET',
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      expect(statusCode).toBe(statusCodes.ok)
    })

    test('Should render summary of which report is being viewed as heading', async () => {
      mswServer.use(
        http.get(`${backendUrl}${backendReportUrl}`, () =>
          HttpResponse.json(mockReport)
        )
      )

      const { result } = await server.inject({
        method: 'GET',
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      const $ = cheerio.load(result)
      expect($('h1').text().trim()).toEqual('Report – 2026 monthly period 1')
    })

    test('Should render breadcrumbs for Organisations, Organisation overview and Registration overview', async () => {
      mswServer.use(
        http.get(`${backendUrl}${backendReportUrl}`, () =>
          HttpResponse.json(mockReport)
        )
      )

      const { result } = await server.inject({
        method: 'GET',
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      const $ = cheerio.load(result)
      const breadcrumbLinks = $('.govuk-breadcrumbs__link')
      expect(breadcrumbLinks).toHaveLength(3)
      expect($(breadcrumbLinks[0]).text()).toEqual('Organisations')
      expect($(breadcrumbLinks[0]).attr('href')).toEqual('/organisations')
      expect($(breadcrumbLinks[1]).text()).toEqual('Organisation overview')
      expect($(breadcrumbLinks[1]).attr('href')).toEqual(
        `/organisations/${organisationId}/overview`
      )
      expect($(breadcrumbLinks[2]).text()).toEqual('Registration overview')
      expect($(breadcrumbLinks[2]).attr('href')).toEqual(
        `/organisations/${organisationId}/registrations/${registrationId}/overview`
      )
    })

    test('Should render the report JSON in a code block', async () => {
      mswServer.use(
        http.get(`${backendUrl}${backendReportUrl}`, () =>
          HttpResponse.json(mockReport)
        )
      )

      const { result } = await server.inject({
        method: 'GET',
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      const $ = cheerio.load(result)
      const code = $('[data-testid="report-json"]')
      expect(code).toHaveLength(1)
      expect(JSON.parse(code.text())).toEqual(mockReport)
    })

    test('Should show 500 error page when backend returns a non-OK response', async () => {
      mswServer.use(
        http.get(`${backendUrl}${backendReportUrl}`, () => {
          throw HttpResponse.text('', { status: 500 })
        })
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
