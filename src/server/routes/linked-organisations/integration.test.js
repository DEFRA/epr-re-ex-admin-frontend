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

describe('linked-organisations', () => {
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
      http.get(`${backendUrl}/v1/linked-organisations`, () => {
        return HttpResponse.json(data, { status })
      })
    )
  }

  const mockLinkedOrgs = [
    {
      id: 'org-1',
      orgId: 101,
      companyDetails: { name: 'Acme Ltd', registrationNumber: '12345678' },
      status: 'active',
      linkedDefraOrganisation: {
        orgId: 'defra-uuid-1',
        orgName: 'Defra Org One',
        linkedAt: '2025-06-15T10:30:00.000Z',
        linkedBy: { email: 'admin@defra.gov.uk', id: 'user-uuid-1' }
      }
    },
    {
      id: 'org-2',
      orgId: 202,
      companyDetails: { name: 'Beta Corp', registrationNumber: '87654321' },
      status: 'active',
      linkedDefraOrganisation: {
        orgId: 'defra-uuid-2',
        orgName: 'Defra Org Two',
        linkedAt: '2025-07-20T14:00:00.000Z',
        linkedBy: { email: 'other@defra.gov.uk', id: 'user-uuid-2' }
      }
    }
  ]

  describe('GET /linked-organisations', () => {
    describe('When user is unauthenticated', () => {
      beforeEach(() => {
        getUserSession.mockReturnValue(null)
      })

      test('Should return unauthorised status code', async () => {
        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/linked-organisations'
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
        stubBackendResponse(mockLinkedOrgs)

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/linked-organisations',
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })

        expect(statusCode).toBe(statusCodes.ok)

        const $ = cheerio.load(result)
        expect($('h1').text()).toContain('Linked organisations')
      })

      test('Should render table with 7 column headers', async () => {
        stubBackendResponse(mockLinkedOrgs)

        const { result } = await server.inject({
          method: 'GET',
          url: '/linked-organisations',
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })

        const $ = cheerio.load(result)
        const headers = $('thead .govuk-table__header')
          .map((_, el) => $(el).text().trim())
          .get()

        expect(headers).toEqual([
          'EPR Organisation Name',
          'EPR Organisation ID',
          'Registration Number',
          'Defra ID Organisation Name',
          'Defra ID Organisation ID',
          'Date Linked',
          'Linked By'
        ])
      })

      test('Should render linked organisation data in table rows', async () => {
        stubBackendResponse(mockLinkedOrgs)

        const { result } = await server.inject({
          method: 'GET',
          url: '/linked-organisations',
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })

        const $ = cheerio.load(result)
        const tableText = $('.govuk-table').text()
        expect(tableText).toContain('Acme Ltd')
        expect(tableText).toContain('101')
        expect(tableText).toContain('Defra Org One')
        expect(tableText).toContain('admin@defra.gov.uk')
        expect(tableText).toContain('Beta Corp')
        expect(tableText).toContain('Defra Org Two')
      })

      test('Should show inset text when no linked organisations', async () => {
        stubBackendResponse([])

        const { result } = await server.inject({
          method: 'GET',
          url: '/linked-organisations',
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })

        const $ = cheerio.load(result)
        expect($('.govuk-inset-text').text()).toContain(
          'No linked organisations found.'
        )
      })

      test('Should render search form with input and button', async () => {
        stubBackendResponse(mockLinkedOrgs)

        const { result } = await server.inject({
          method: 'GET',
          url: '/linked-organisations',
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })

        const $ = cheerio.load(result)
        expect($('form.app-filters input[name="search"]').length).toBe(1)
        expect($('form.app-filters button.govuk-button').text().trim()).toBe(
          'Search'
        )
      })

      test('Should render search form with GET method', async () => {
        stubBackendResponse(mockLinkedOrgs)

        const { result } = await server.inject({
          method: 'GET',
          url: '/linked-organisations',
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })

        const $ = cheerio.load(result)
        expect($('form.app-filters').attr('method')).toBe('get')
      })

      test('Should render download CSV button', async () => {
        stubBackendResponse(mockLinkedOrgs)

        const { result } = await server.inject({
          method: 'GET',
          url: '/linked-organisations',
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })

        const $ = cheerio.load(result)
        const downloadForm = $('form[action="/linked-organisations/download"]')
        expect(downloadForm.length).toBe(1)
        expect(downloadForm.find('button.govuk-button').text().trim()).toBe(
          'Download CSV'
        )
      })

      test('Should have navigation item for linked organisations', async () => {
        stubBackendResponse(mockLinkedOrgs)

        const { result } = await server.inject({
          method: 'GET',
          url: '/linked-organisations',
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })

        const $ = cheerio.load(result)
        const navLink = $('a[href="/linked-organisations"]')
        expect(navLink.length).toBeGreaterThan(0)
      })

      test('Should return server error when backend fails', async () => {
        stubBackendResponse(
          { error: 'Server error' },
          statusCodes.internalServerError
        )

        const { statusCode, result } = await server.inject({
          method: 'GET',
          url: '/linked-organisations',
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

  describe('GET /linked-organisations?search= (search)', () => {
    describe('When user is authenticated', () => {
      beforeEach(() => {
        getUserSession.mockReturnValue(mockUserSession)
      })

      test('Should render page with search results', async () => {
        stubBackendResponse(mockLinkedOrgs)

        const { statusCode, result } = await server.inject({
          method: 'GET',
          url: '/linked-organisations?search=acme',
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })

        expect(statusCode).toBe(statusCodes.ok)

        const $ = cheerio.load(result)
        expect($('h1').text()).toContain('Linked organisations')
        expect($('form.app-filters input[name="search"]').val()).toBe('acme')
      })

      test('Should show results count when searching', async () => {
        stubBackendResponse(mockLinkedOrgs)

        const { result } = await server.inject({
          method: 'GET',
          url: '/linked-organisations?search=acme',
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })

        const $ = cheerio.load(result)
        expect($('.govuk-heading-l').text()).toContain('2 results found')
      })

      test('Should show clear search link when searching', async () => {
        stubBackendResponse(mockLinkedOrgs)

        const { result } = await server.inject({
          method: 'GET',
          url: '/linked-organisations?search=acme',
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })

        const $ = cheerio.load(result)
        const clearLink = $(
          'a[href="/linked-organisations"].govuk-button--inverse'
        )
        expect(clearLink.length).toBe(1)
        expect(clearLink.text()).toContain('Clear search')
      })

      test('Should show 0 results message when search matches nothing', async () => {
        stubBackendResponse([])

        const { result } = await server.inject({
          method: 'GET',
          url: '/linked-organisations?search=zzz',
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })

        const $ = cheerio.load(result)
        expect($('.govuk-heading-l').text()).toContain('0 results found')
        expect($('.govuk-inset-text').text()).toContain(
          "No linked organisations found matching 'zzz'"
        )
      })
    })
  })

  describe('POST /linked-organisations/download', () => {
    describe('When user is unauthenticated', () => {
      beforeEach(() => {
        getUserSession.mockReturnValue(null)
      })

      test('Should return unauthorised status code', async () => {
        const { result, statusCode } = await server.inject({
          method: 'POST',
          url: '/linked-organisations/download',
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
        stubBackendResponse(mockLinkedOrgs)

        const { cookie, crumb } = await getCsrfToken(
          server,
          '/linked-organisations',
          { strategy: 'session', credentials: mockUserSession }
        )

        const { statusCode, headers, payload } = await server.inject({
          method: 'POST',
          url: '/linked-organisations/download',
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
          'attachment; filename="linked-organisations.csv"'
        )
        expect(payload).toContain('Linked organisations report')
        expect(payload).toContain('Acme Ltd')
        expect(payload).toContain('Defra Org One')
        expect(payload).toContain('admin@defra.gov.uk')
      })

      test('Should redirect back to GET with error on backend failure', async () => {
        stubBackendResponse({ message: 'Server error' }, 500)

        const { cookie, crumb } = await getCsrfToken(
          server,
          '/linked-organisations',
          { strategy: 'session', credentials: mockUserSession }
        )

        const { statusCode, headers } = await server.inject({
          method: 'POST',
          url: '/linked-organisations/download',
          headers: { cookie },
          payload: { crumb },
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })

        expect(statusCode).toBe(302)
        expect(headers.location).toBe('/linked-organisations')
      })

      test('Should reject request without CSRF token', async () => {
        stubBackendResponse(mockLinkedOrgs)

        const { statusCode } = await server.inject({
          method: 'POST',
          url: '/linked-organisations/download',
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
