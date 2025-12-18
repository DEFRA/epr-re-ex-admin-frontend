import { config } from '#config/config.js'
import { statusCodes } from '#server/common/constants/status-codes.js'
import { getUserSession } from '#server/common/helpers/auth/get-user-session.js'
import { mockUserSession } from '#server/common/test-helpers/fixtures.js'
import { createMockOidcServer } from '#server/common/test-helpers/mock-oidc.js'
import { getCsrfToken } from '#server/common/test-helpers/csrf-helper.js'
import { createServer } from '#server/server.js'
import { vi } from 'vitest'
import {
  http,
  HttpResponse,
  server as mswServer
} from '../../../../.vite/setup-msw.js'
import * as cheerio from 'cheerio'

vi.mock('#server/common/helpers/auth/get-user-session.js', () => ({
  getUserSession: vi.fn().mockReturnValue(null)
}))

describe('#organisationsController', () => {
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
    // Ensure any stubbed globals are reset after each test
    if (typeof vi.unstubAllGlobals === 'function') {
      vi.unstubAllGlobals()
    }
  })

  describe('When user is unauthenticated', () => {
    test('Should return unauthorised status code and unauthorised view', async () => {
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/organisations'
      })

      expect(statusCode).toBe(statusCodes.unauthorised)
      expect(result).toEqual(expect.stringContaining('Unauthorised'))
      expect(result).toEqual(
        expect.stringMatching(/Organisations.*\|.*epr-re-ex-admin-frontend/)
      )
    })
  })

  describe('When user is authenticated', () => {
    beforeAll(() => {
      // Mock an authenticated session
      getUserSession.mockReturnValue(mockUserSession)
    })

    test('Should return OK and render organisations table from backend data', async () => {
      // Mock backend API response for organisations
      const mockOrganisations = [
        {
          id: 'org-1',
          orgId: 'org-1',
          status: 'ACTIVE',
          statusHistory: [
            { status: 'PENDING', updatedAt: '2025-09-01T00:00:00Z' },
            { status: 'ACTIVE', updatedAt: '2025-10-01T00:00:00Z' }
          ],
          companyDetails: {
            name: 'Acme Ltd',
            registrationNumber: '12345678'
          },
          submittedToRegulator: 'regulator-name'
        }
      ]

      const getOrganisationsHandler = http.get(
        `${backendUrl}/v1/organisations`,
        () => {
          return HttpResponse.json(mockOrganisations)
        }
      )

      mswServer.use(getOrganisationsHandler)
      const requestSpy = vi.fn()
      mswServer.events.on('request:start', requestSpy)

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/organisations',
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        }
      })

      expect(statusCode).toBe(statusCodes.ok)

      const $ = cheerio.load(result)

      // Basic page assertions
      expect($.text()).not.toContain('Sign in')
      expect($.text()).toContain('Organisations')

      // Rendered table headers
      const tableHeaders = $('table thead tr th')
      expect(tableHeaders).toHaveLength(6)
      expect($(tableHeaders[0]).text()).toEqual('Name')
      expect($(tableHeaders[1]).text()).toEqual('Organisation ID')
      expect($(tableHeaders[2]).text()).toEqual('Registration Number')
      expect($(tableHeaders[3]).text()).toEqual('Regulator')
      expect($(tableHeaders[4]).text()).toEqual('Status')
      expect($(tableHeaders[5]).text()).toEqual('Actions')

      // Rendered row data
      const rowHeader = $('table tbody tr th')
      expect(rowHeader).toHaveLength(1)
      expect($(rowHeader).text()).toEqual('Acme Ltd')
      const rowData = $('table tbody tr td')
      expect(rowData).toHaveLength(5)
      expect($(rowData[0]).text()).toEqual('org-1')
      expect($(rowData[1]).text()).toEqual('12345678')
      expect($(rowData[2]).text()).toEqual('REGULATOR-NAME')
      expect($(rowData[3]).find('strong.govuk-tag').text().trim()).toEqual(
        'ACTIVE'
      )

      const actionLinks = $(rowData[4]).find('a')
      expect(actionLinks).toHaveLength(3)
      expect($(actionLinks[0]).text()).toEqual('Edit')
      expect($(actionLinks[0]).attr('href')).toEqual('/organisations/org-1')
      expect($(actionLinks[1]).text()).toEqual('View submission data')
      expect($(actionLinks[1]).attr('href')).toEqual(
        '/defra-forms-submission/org-1'
      )
      expect($(actionLinks[2]).text()).toEqual('View system logs')
      expect($(actionLinks[2]).attr('href')).toEqual(
        '/system-logs?referenceNumber=org-1'
      )

      expect(requestSpy).toHaveBeenCalledTimes(1)
    })

    test('Should show 500 error page when backend returns a non-OK response', async () => {
      const getOrganisationsHandler = http.get(
        `${backendUrl}/v1/organisations`,
        () => {
          throw HttpResponse.text('', { status: 500 })
        }
      )

      mswServer.use(getOrganisationsHandler)

      const { result } = await server.inject({
        method: 'GET',
        url: '/organisations',
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        }
      })

      expect(result).toEqual(
        expect.stringContaining('Sorry, there is a problem with the service')
      )
      expect(result).toEqual(
        expect.stringMatching(/Organisations.*\|.*epr-re-ex-admin-frontend/)
      )
    })

    test('Should render without status when statusHistory is empty', async () => {
      // Organisation with empty statusHistory
      const mockOrganisations = [
        {
          id: 'org-2',
          orgId: 'org-2',
          status: null,
          statusHistory: [],
          companyDetails: {
            name: 'Beta Corp',
            registrationNumber: '87654321'
          },
          submittedToRegulator: 'regulator-name'
        }
      ]

      const getOrganisationsHandler = http.get(
        `${backendUrl}/v1/organisations`,
        () => {
          return HttpResponse.json(mockOrganisations)
        }
      )

      mswServer.use(getOrganisationsHandler)

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/organisations',
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        }
      })

      expect(statusCode).toBe(statusCodes.ok)

      const $ = cheerio.load(result)

      // Rendered row data
      const rowHeader = $('table tbody tr th')
      expect(rowHeader).toHaveLength(1)
      expect($(rowHeader).text()).toEqual('Beta Corp')
      const rowData = $('table tbody tr td')
      expect(rowData).toHaveLength(5)
      expect($(rowData[0]).text()).toEqual('org-2')
      expect($(rowData[1]).text()).toEqual('87654321')
      expect($(rowData[2]).text()).toEqual('REGULATOR-NAME')

      // status rendered as an empty govukTag
      expect($(rowData[3]).html()).toContain('govuk-tag')
      expect($(rowData[3]).find('strong.govuk-tag').text().trim()).toEqual('')
    })

    test('Should display message when backend returns non array', async () => {
      const getOrganisationsHandler = http.get(
        `${backendUrl}/v1/organisations`,
        () => {
          return HttpResponse.json({})
        }
      )

      mswServer.use(getOrganisationsHandler)

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/organisations',
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        }
      })

      expect(statusCode).toBe(statusCodes.ok)

      // Should render the inset text message instead of a table
      expect(result).toEqual(expect.stringContaining('No organisations found.'))
      expect(result).not.toEqual(expect.stringContaining('Organisation ID'))
    })

    test('Should filter organisations by search term when POSTing', async () => {
      const mockOrganisations = [
        {
          id: 'org-1',
          orgId: 'org-1',
          status: 'ACTIVE',
          statusHistory: [
            { status: 'ACTIVE', updatedAt: '2025-10-01T00:00:00Z' }
          ],
          companyDetails: {
            name: 'Acme Ltd',
            registrationNumber: '12345678'
          },
          submittedToRegulator: 'regulator-name'
        },
        {
          id: 'org-2',
          orgId: 'org-2',
          status: 'PENDING',
          statusHistory: [
            { status: 'PENDING', updatedAt: '2025-10-01T00:00:00Z' }
          ],
          companyDetails: {
            name: 'Beta Corp',
            registrationNumber: '87654321'
          },
          submittedToRegulator: 'another-regulator'
        }
      ]

      const getOrganisationsHandler = http.get(
        `${backendUrl}/v1/organisations`,
        () => {
          return HttpResponse.json(mockOrganisations)
        }
      )

      mswServer.use(getOrganisationsHandler)

      const { cookie, crumb } = await getCsrfToken(server, '/organisations', {
        strategy: 'session',
        credentials: mockUserSession
      })

      const { result, statusCode } = await server.inject({
        method: 'POST',
        url: '/organisations',
        headers: { cookie },
        payload: { search: 'Acme', crumb },
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        }
      })

      expect(statusCode).toBe(statusCodes.ok)

      // Should show matching organisation
      expect(result).toEqual(expect.stringContaining('Acme Ltd'))
      expect(result).toEqual(expect.stringContaining('org-1'))

      // Should not show non-matching organisation
      expect(result).not.toEqual(expect.stringContaining('Beta Corp'))
      expect(result).not.toEqual(expect.stringContaining('org-2'))
    })

    test('Should show no organisations when search term matches nothing', async () => {
      const mockOrganisations = [
        {
          id: 'org-1',
          orgId: 'org-1',
          status: 'ACTIVE',
          statusHistory: [
            { status: 'ACTIVE', updatedAt: '2025-10-01T00:00:00Z' }
          ],
          companyDetails: {
            name: 'Acme Ltd',
            registrationNumber: '12345678'
          },
          submittedToRegulator: 'regulator-name'
        }
      ]

      const getOrganisationsHandler = http.get(
        `${backendUrl}/v1/organisations`,
        () => {
          return HttpResponse.json(mockOrganisations)
        }
      )

      mswServer.use(getOrganisationsHandler)

      const { cookie, crumb } = await getCsrfToken(server, '/organisations', {
        strategy: 'session',
        credentials: mockUserSession
      })

      const { result, statusCode } = await server.inject({
        method: 'POST',
        url: '/organisations',
        headers: { cookie },
        payload: { search: 'NonExistent Company', crumb },
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        }
      })

      expect(statusCode).toBe(statusCodes.ok)

      // Should not show the organisation that didn't match
      expect(result).not.toEqual(expect.stringContaining('Acme Ltd'))

      // Should show search-specific message about no results
      expect(result).toEqual(expect.stringContaining('0 results found'))
      expect(result).toEqual(
        expect.stringContaining('No organisations found matching')
      )
      expect(result).toEqual(expect.stringContaining('NonExistent Company'))
    })

    test('Should reject POST request without CSRF token', async () => {
      const { statusCode } = await server.inject({
        method: 'POST',
        url: '/organisations',
        payload: { search: 'Test' },
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        }
      })

      expect(statusCode).toBe(statusCodes.forbidden)
    })

    test('Should reject POST request with invalid CSRF token', async () => {
      const { cookie } = await getCsrfToken(server, '/organisations', {
        strategy: 'session',
        credentials: mockUserSession
      })

      const { statusCode } = await server.inject({
        method: 'POST',
        url: '/organisations',
        headers: { cookie },
        payload: { search: 'Test', crumb: 'invalid-csrf-token' },
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        }
      })

      expect(statusCode).toBe(statusCodes.forbidden)
    })
  })
})
