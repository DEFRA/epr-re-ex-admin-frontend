import { vi } from 'vitest'
import * as cheerio from 'cheerio'
import { createServer } from '#server/server.js'
import { config } from '#config/config.js'
import { statusCodes } from '#server/common/constants/status-codes.js'
import { mockUserSession } from '#server/common/test-helpers/fixtures.js'
import { getUserSession } from '#server/common/helpers/auth/get-user-session.js'
import { createMockOidcServer } from '#server/common/test-helpers/mock-oidc.js'
import { http, server as mswServer, HttpResponse } from '#vite/setup-msw.js'

vi.mock('#server/common/helpers/auth/get-user-session.js', () => ({
  getUserSession: vi.fn().mockReturnValue(null)
}))

vi.mock('#server/routes/organisations/controller.js', async (importOriginal) =>
  importOriginal()
)

describe('organisation GET controller', () => {
  const originalBackendUrl = config.get('eprBackendUrl')
  const backendUrl = 'http://mock-backend'
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
        url: '/organisations/123'
      })

      expect(statusCode).toBe(statusCodes.unauthorised)
      expect(result).toEqual(expect.stringContaining('Unauthorised'))
    })
  })

  describe('When user is authenticated', () => {
    beforeEach(() => {
      vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
    })

    test('Should return OK and render organisation details', async () => {
      const orgId = 'org-123'
      const mockOrganisation = {
        id: orgId,
        orgId: 12345,
        status: 'approved',
        companyDetails: {
          name: 'Test Company <script>alert("xss")</script>',
          registrationNumber: '12345678'
        },
        // Include characters that need escaping
        notes:
          'Line separator: \u2028 Paragraph separator: \u2029 HTML comment: -->',
        registrations: [],
        accreditations: []
      }

      const getOrganisationHandler = http.get(
        `${backendUrl}/v1/organisations/${orgId}`,
        () => {
          return HttpResponse.json(mockOrganisation)
        }
      )

      mswServer.use(getOrganisationHandler)

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: `/organisations/${orgId}`,
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        }
      })

      expect(statusCode).toBe(statusCodes.ok)
      expect(result).toContain('Organisation')
    })

    test('Should show 500 error page when backend fetch throws', async () => {
      mswServer.use(
        http.get(`${backendUrl}/v1/organisations/org-1`, () => {
          return HttpResponse.error()
        })
      )

      const { result } = await server.inject({
        method: 'GET',
        url: '/organisations/org-1',
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        }
      })

      expect(result).toContain('Sorry, there is a problem with the service')
    })

    describe('status changes', () => {
      const organisationWithRecords = {
        id: 'org-1',
        companyDetails: { name: 'ACME Ltd' },
        registrations: [
          {
            id: 'reg-1',
            registrationNumber: 'R26ER1',
            status: 'approved',
            accreditationId: 'acc-1'
          },
          { id: 'reg-2', status: 'created' }
        ],
        accreditations: [
          { id: 'acc-1', accreditationNumber: 'A26ER1', status: 'approved' },
          { id: 'acc-2', accreditationNumber: 'A26ER2', status: 'created' }
        ]
      }

      const loadPage = async (credentials = mockUserSession) => {
        mswServer.use(
          http.get(`${backendUrl}/v1/organisations/org-1`, () =>
            HttpResponse.json(organisationWithRecords)
          )
        )
        const { result } = await server.inject({
          method: 'GET',
          url: '/organisations/org-1',
          auth: { strategy: 'session', credentials }
        })
        return cheerio.load(result)
      }

      /** @param {cheerio.CheerioAPI} $ */
      const tableRows = ($, caption) =>
        $(`#status-changes table:has(caption:contains("${caption}")) tbody tr`)
          .toArray()
          .map((row) =>
            $(row)
              .find('td')
              .toArray()
              .map((cell) => $(cell).text().trim())
          )

      test('lists every registration, unapproved ones included, with its linked accreditation number and status changes', async () => {
        const $ = await loadPage()

        expect(tableRows($, 'Registrations')).toEqual([
          [
            'reg-1',
            'R26ER1',
            'A26ER1',
            'approved',
            'Cancel registration R26ER1'
          ],
          [
            'reg-2',
            '',
            '',
            'created',
            'Approve registration reg-2Reject registration reg-2'
          ]
        ])
        expect(
          $('#status-changes a:contains("Cancel")').first().attr('href')
        ).toBe('/organisations/org-1/registrations/reg-1/cancel/confirm')
      })

      test('lists every accreditation with its linked registration number and status changes', async () => {
        const $ = await loadPage()

        expect(tableRows($, 'Accreditations')).toEqual([
          [
            'acc-1',
            'A26ER1',
            'R26ER1',
            'approved',
            'Suspend accreditation A26ER1'
          ],
          ['acc-2', 'A26ER2', '', 'created', 'Not linked to a registration']
        ])
        expect($('#status-changes a:contains("Suspend")').attr('href')).toBe(
          '/organisations/org-1/registrations/reg-1/accreditations/acc-1/suspend/confirm'
        )
      })
    })
  })

  describe('When user has read-only access', () => {
    const readOnlySession = { ...mockUserSession, scopes: ['admin.read'] }

    beforeEach(() => {
      vi.mocked(getUserSession).mockResolvedValue(readOnlySession)
    })

    test('Should render the organisation without the editing form', async () => {
      mswServer.use(
        http.get(`${backendUrl}/v1/organisations/org-1`, () =>
          HttpResponse.json({
            id: 'org-1',
            companyDetails: { name: 'ACME Ltd' },
            registrations: [
              { id: 'reg-1', registrationNumber: 'R26ER1', status: 'approved' }
            ],
            accreditations: []
          })
        )
      )

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/organisations/org-1',
        auth: {
          strategy: 'session',
          credentials: readOnlySession
        }
      })

      expect(statusCode).toBe(statusCodes.ok)
      const $ = cheerio.load(result)
      expect($('h1').text()).toBe('ACME Ltd')
      expect($('#jsoneditor').attr('data-readonly')).toBe('true')
      expect($('main').text()).toContain(
        'You do not have permission to edit this organisation.'
      )
      expect($('#jsoneditor-form')).toHaveLength(0)
      expect($('button:contains("Save")')).toHaveLength(0)
    })

    test('Should list the registrations without status changes', async () => {
      mswServer.use(
        http.get(`${backendUrl}/v1/organisations/org-1`, () =>
          HttpResponse.json({
            id: 'org-1',
            companyDetails: { name: 'ACME Ltd' },
            registrations: [
              { id: 'reg-1', registrationNumber: 'R26ER1', status: 'approved' }
            ],
            accreditations: []
          })
        )
      )

      const { result } = await server.inject({
        method: 'GET',
        url: '/organisations/org-1',
        auth: { strategy: 'session', credentials: readOnlySession }
      })

      const $ = cheerio.load(result)
      expect($('#status-changes th:contains("Actions")')).toHaveLength(0)
      expect($('#status-changes td:contains("R26ER1")')).toHaveLength(1)
      expect($('#status-changes a')).toHaveLength(0)
    })
  })
})
