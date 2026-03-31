import * as cheerio from 'cheerio'
import { vi } from 'vitest'

import { config } from '#config/config.js'
import { statusCodes } from '#server/common/constants/status-codes.js'
import { getUserSession } from '#server/common/helpers/auth/get-user-session.js'
import { getCsrfToken } from '#server/common/test-helpers/csrf-helper.js'
import { mockUserSession } from '#server/common/test-helpers/fixtures.js'
import { createMockOidcServer } from '#server/common/test-helpers/mock-oidc.js'
import { createServer } from '#server/server.js'
import { HttpResponse, http, server as mswServer } from '#vite/setup-msw.js'

vi.mock('#server/common/helpers/auth/get-user-session.js', () => ({
  getUserSession: vi.fn().mockReturnValue(null)
}))

describe('ors-upload download integration', () => {
  const backendUrl = config.get('eprBackendUrl')
  const pagePath = '/overseas-sites'
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

  const stubListResponse = (rows = []) => {
    mswServer.use(
      http.get(`${backendUrl}/v1/admin/overseas-sites`, ({ request }) => {
        const url = new URL(request.url)
        const isAllRequest = url.searchParams.get('all') === 'true'

        if (isAllRequest) {
          return HttpResponse.json({
            rows,
            pagination: {
              page: 1,
              pageSize: rows.length || 50,
              totalItems: rows.length,
              totalPages: rows.length ? 1 : 0,
              hasNextPage: false,
              hasPreviousPage: false
            }
          })
        }

        return HttpResponse.json({
          rows,
          pagination: {
            page: 1,
            pageSize: 50,
            totalItems: rows.length,
            totalPages: rows.length ? 1 : 0,
            hasNextPage: false,
            hasPreviousPage: false
          }
        })
      })
    )
  }

  const mockRows = [
    {
      orgId: 500001,
      registrationNumber: 'R25SR5000010001PA',
      accreditationNumber: 'ACC5000010001',
      orsId: '001',
      packagingWasteCategory: 'paper',
      destinationCountry: 'France',
      overseasReprocessorName: 'Alpha Reprocessor',
      addressLine1: '1 Rue de Test',
      addressLine2: null,
      cityOrTown: 'Paris',
      stateProvinceOrRegion: null,
      postcode: null,
      coordinates: null,
      validFrom: '2025-04-01T00:00:00.000Z'
    }
  ]

  describe('GET /overseas-sites', () => {
    describe('When user is unauthenticated', () => {
      beforeEach(() => {
        getUserSession.mockReturnValue(null)
      })

      test('Should return unauthorised status code', async () => {
        const { statusCode } = await server.inject({
          method: 'GET',
          url: pagePath
        })

        expect(statusCode).toBe(statusCodes.unauthorised)
      })
    })

    describe('When user is authenticated', () => {
      beforeEach(() => {
        getUserSession.mockReturnValue(mockUserSession)
      })

      test('Should render upload at the top and download below the table', async () => {
        stubListResponse(mockRows)

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: pagePath,
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })

        expect(statusCode).toBe(statusCodes.ok)

        const $ = cheerio.load(result)
        const buttonGroup = $('.govuk-button-group').first()
        const table = $('table').first()
        const downloadForm = $('form[method="POST"]').first()

        expect(buttonGroup.text()).toContain('Upload ORS workbooks')
        expect(buttonGroup.text()).not.toContain('Download CSV')
        expect(
          buttonGroup.find('a[href="/overseas-sites/imports"]').length
        ).toBe(1)
        expect(buttonGroup.find('form[method="POST"]').length).toBe(0)

        expect(table.length).toBe(1)
        expect(downloadForm.length).toBe(1)
        expect(downloadForm.text()).toContain('Download CSV')
        expect(downloadForm.find('button.govuk-button--secondary').length).toBe(
          0
        )
        expect(result.indexOf('</table>')).toBeLessThan(
          result.indexOf('<form method="POST">')
        )
      })

      test('Should hide download action when there are no overseas sites', async () => {
        stubListResponse([])

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: pagePath,
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })

        expect(statusCode).toBe(statusCodes.ok)

        const $ = cheerio.load(result)
        const buttonGroup = $('.govuk-button-group').first()

        expect(buttonGroup.text()).toContain('Upload ORS workbooks')
        expect(buttonGroup.text()).not.toContain('Download CSV')
        expect(buttonGroup.find('form[method="POST"]').length).toBe(0)
      })
    })
  })

  describe('POST /overseas-sites', () => {
    describe('When user is unauthenticated', () => {
      beforeEach(() => {
        getUserSession.mockReturnValue(null)
      })

      test('Should return unauthorised status code', async () => {
        const { statusCode } = await server.inject({
          method: 'POST',
          url: pagePath,
          payload: {}
        })

        expect(statusCode).toBe(statusCodes.unauthorised)
      })
    })

    describe('When user is authenticated', () => {
      beforeEach(() => {
        getUserSession.mockReturnValue(mockUserSession)
      })

      test('Should return CSV file on successful request', async () => {
        stubListResponse(mockRows)

        const { cookie, crumb } = await getCsrfToken(server, pagePath, {
          strategy: 'session',
          credentials: mockUserSession
        })

        const { statusCode, headers, payload } = await server.inject({
          method: 'POST',
          url: pagePath,
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
          'attachment; filename="overseas-reprocessing-sites.csv"'
        )
        expect(payload).toContain('"Org ID","Registration Number"')
        expect(payload).toContain('Alpha Reprocessor')
        expect(payload).toContain('1 April 2025')
      })

      test('Should redirect back to the list page on backend failure', async () => {
        mswServer.use(
          http.get(`${backendUrl}/v1/admin/overseas-sites`, ({ request }) => {
            const url = new URL(request.url)

            if (url.searchParams.get('all') === 'true') {
              return HttpResponse.json(
                { message: 'Backend download failure' },
                { status: statusCodes.internalServerError }
              )
            }

            return HttpResponse.json({
              rows: mockRows,
              pagination: {
                page: 1,
                pageSize: 50,
                totalItems: mockRows.length,
                totalPages: 1,
                hasNextPage: false,
                hasPreviousPage: false
              }
            })
          })
        )

        const { cookie, crumb } = await getCsrfToken(server, pagePath, {
          strategy: 'session',
          credentials: mockUserSession
        })

        const { statusCode, headers } = await server.inject({
          method: 'POST',
          url: pagePath,
          headers: { cookie },
          payload: { crumb },
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })

        expect(statusCode).toBe(302)
        expect(headers.location).toBe('/overseas-sites')
      })

      test('Should reject request without CSRF token', async () => {
        stubListResponse(mockRows)

        const { statusCode } = await server.inject({
          method: 'POST',
          url: pagePath,
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
