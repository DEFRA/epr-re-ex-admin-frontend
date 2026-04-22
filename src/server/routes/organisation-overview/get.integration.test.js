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

describe('#organisationOverviewController', () => {
  const originalBackendUrl = config.get('eprBackendUrl')
  const backendUrl = 'http://mock-backend'
  const organisationId = '69c3b4f0abda9efa68dd6697'
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

  describe('When user is unauthenticated', () => {
    test('Should return unauthorised status code and unauthorised view', async () => {
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: `/organisations/${organisationId}/overview`
      })

      expect(statusCode).toBe(statusCodes.unauthorised)
      expect(result).toEqual(expect.stringContaining('Unauthorised'))
    })
  })

  describe('When user is authenticated', () => {
    beforeAll(() => {
      getUserSession.mockReturnValue(mockUserSession)
    })

    const mockOverview = {
      id: organisationId,
      companyName: 'ACME Ltd',
      registrations: [
        {
          id: '69c3b4f0abda9efa68dd669b',
          registrationNumber: 'REG-50030-001',
          status: 'approved',
          processingType: 'exporter',
          material: 'glass',
          site: 'Site A',
          accreditation: {
            id: '69c3b4f0abda9efa68dd6698',
            accreditationNumber: 'ACC-50030-001',
            status: 'approved'
          }
        }
      ]
    }

    test('Should return OK and render the organisation overview page', async () => {
      mswServer.use(
        http.get(
          `${backendUrl}/v1/organisations/${organisationId}/overview`,
          () => HttpResponse.json(mockOverview)
        )
      )

      const { statusCode } = await server.inject({
        method: 'GET',
        url: `/organisations/${organisationId}/overview`,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      expect(statusCode).toBe(statusCodes.ok)
    })

    test('Should render the company name as heading', async () => {
      mswServer.use(
        http.get(
          `${backendUrl}/v1/organisations/${organisationId}/overview`,
          () => HttpResponse.json(mockOverview)
        )
      )

      const { result } = await server.inject({
        method: 'GET',
        url: `/organisations/${organisationId}/overview`,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      const $ = cheerio.load(result)
      expect($('h1').text().trim()).toEqual('ACME Ltd')
    })

    test('Should render a breadcrumb linking to organisations list', async () => {
      mswServer.use(
        http.get(
          `${backendUrl}/v1/organisations/${organisationId}/overview`,
          () => HttpResponse.json(mockOverview)
        )
      )

      const { result } = await server.inject({
        method: 'GET',
        url: `/organisations/${organisationId}/overview`,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      const $ = cheerio.load(result)
      const breadcrumbLinks = $('.govuk-breadcrumbs__link')
      expect(breadcrumbLinks).toHaveLength(1)
      expect($(breadcrumbLinks[0]).text()).toEqual('Organisations')
      expect($(breadcrumbLinks[0]).attr('href')).toEqual('/organisations')
    })

    test('Should render table headers', async () => {
      mswServer.use(
        http.get(
          `${backendUrl}/v1/organisations/${organisationId}/overview`,
          () => HttpResponse.json(mockOverview)
        )
      )

      const { result } = await server.inject({
        method: 'GET',
        url: `/organisations/${organisationId}/overview`,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      const $ = cheerio.load(result)
      const headers = $('table thead tr th')
      expect(headers).toHaveLength(8)
      expect($(headers[0]).text()).toEqual('Registration number')
      expect($(headers[1]).text()).toEqual('Status')
      expect($(headers[2]).text()).toEqual('Processing type')
      expect($(headers[3]).text()).toEqual('Material')
      expect($(headers[4]).text()).toEqual('Site')
      expect($(headers[5]).text()).toEqual('Accreditation number')
      expect($(headers[6]).text()).toEqual('Accreditation status')
      expect($(headers[7]).text()).toEqual('Actions')
    })

    test('Should render registration row data', async () => {
      mswServer.use(
        http.get(
          `${backendUrl}/v1/organisations/${organisationId}/overview`,
          () => HttpResponse.json(mockOverview)
        )
      )

      const { result } = await server.inject({
        method: 'GET',
        url: `/organisations/${organisationId}/overview`,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      const $ = cheerio.load(result)
      const cells = $('table tbody tr td')
      expect($(cells[0]).text().trim()).toEqual('REG-50030-001')
      expect($(cells[1]).find('strong.govuk-tag').text().trim()).toEqual(
        'approved'
      )
      expect($(cells[2]).text().trim()).toEqual('exporter')
      expect($(cells[3]).text().trim()).toEqual('glass')
      expect($(cells[4]).text().trim()).toEqual('Site A')
      expect($(cells[5]).text().trim()).toEqual('ACC-50030-001')
      expect($(cells[6]).find('strong.govuk-tag').text().trim()).toEqual(
        'approved'
      )

      const viewLink = $(cells[7]).find('a')
      expect(viewLink.text()).toEqual('View')
      expect(viewLink.attr('href')).toEqual(
        `/organisations/${organisationId}/registrations/69c3b4f0abda9efa68dd669b/overview`
      )
    })

    test('Should render a dash in accreditation cells when registration has no accreditation', async () => {
      const overviewWithoutAccreditation = {
        ...mockOverview,
        registrations: [
          {
            id: '69c3b4f0abda9efa68dd669c',
            registrationNumber: 'REG-50030-002',
            status: 'pending',
            processingType: 'importer',
            material: 'plastic',
            site: 'Site B',
            accreditation: null
          }
        ]
      }

      mswServer.use(
        http.get(
          `${backendUrl}/v1/organisations/${organisationId}/overview`,
          () => HttpResponse.json(overviewWithoutAccreditation)
        )
      )

      const { result } = await server.inject({
        method: 'GET',
        url: `/organisations/${organisationId}/overview`,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      const $ = cheerio.load(result)
      const cells = $('table tbody tr td')
      expect($(cells[5]).text().trim()).toEqual('-')
      expect($(cells[6]).text().trim()).toEqual('-')
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
        url: `/organisations/${organisationId}/overview`,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      expect(result).toEqual(
        expect.stringContaining('Sorry, there is a problem with the service')
      )
    })
  })
})
