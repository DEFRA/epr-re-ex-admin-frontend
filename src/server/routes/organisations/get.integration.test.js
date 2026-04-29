import { vi } from 'vitest'
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

const buildOrg = (overrides = {}) => ({
  id: 'org-1',
  orgId: 'org-1',
  status: 'ACTIVE',
  statusHistory: [{ status: 'ACTIVE', updatedAt: '2025-10-01T00:00:00Z' }],
  companyDetails: {
    name: 'Acme Ltd',
    registrationNumber: '12345678'
  },
  submittedToRegulator: 'regulator-name',
  ...overrides
})

const envelope = (items, overrides = {}) => ({
  items,
  page: 1,
  pageSize: 50,
  totalItems: items.length,
  totalPages: items.length === 0 ? 0 : 1,
  ...overrides
})

describe('GET /organisations', () => {
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

  const stubBackendResponse = (response) => {
    const calls = []
    mswServer.use(
      http.get(
        `${config.get('eprBackendUrl')}/v1/organisations`,
        ({ request }) => {
          const url = new URL(request.url)
          calls.push({ query: Object.fromEntries(url.searchParams) })
          return response
        }
      )
    )
    return calls
  }

  describe('When user is unauthenticated', () => {
    test('Should return unauthorised status code and unauthorised view', async () => {
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/organisations'
      })

      expect(statusCode).toBe(statusCodes.unauthorised)
      expect(result).toEqual(expect.stringContaining('Unauthorised'))
    })
  })

  describe('When user is authenticated', () => {
    beforeEach(() => {
      getUserSession.mockReturnValue(mockUserSession)
    })

    const loadPage = async (queryParams = new URLSearchParams()) => {
      const url = queryParams.size
        ? `/organisations?${queryParams}`
        : '/organisations'
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url,
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        }
      })
      return { $: cheerio.load(result), statusCode, raw: result }
    }

    describe('initial render (no query params)', () => {
      test('passes default page and pageSize to the backend', async () => {
        const calls = stubBackendResponse(HttpResponse.json(envelope([])))

        await loadPage()

        expect(calls).toHaveLength(1)
        expect(calls[0].query).toMatchObject({
          page: '1',
          pageSize: '50'
        })
        expect(calls[0].query.search).toBeUndefined()
      })

      test('renders the search form with empty value', async () => {
        stubBackendResponse(HttpResponse.json(envelope([])))

        const { $, statusCode } = await loadPage()

        expect(statusCode).toBe(statusCodes.ok)
        expect($('input[name="search"]').val()).toBe('')
      })

      test('renders organisations from the envelope items', async () => {
        stubBackendResponse(HttpResponse.json(envelope([buildOrg()])))

        const { $, statusCode } = await loadPage()

        expect(statusCode).toBe(statusCodes.ok)
        const rowHeader = $('table tbody tr th')
        expect(rowHeader).toHaveLength(1)
        expect(rowHeader.text()).toEqual('Acme Ltd')
      })
    })

    describe('search via query string', () => {
      test('passes search term to the backend', async () => {
        const calls = stubBackendResponse(HttpResponse.json(envelope([])))

        await loadPage(new URLSearchParams({ search: 'acme' }))

        expect(calls[0].query).toMatchObject({
          search: 'acme',
          page: '1',
          pageSize: '50'
        })
      })

      test('populates the search input with the search term', async () => {
        stubBackendResponse(HttpResponse.json(envelope([buildOrg()])))

        const { $ } = await loadPage(new URLSearchParams({ search: 'Acme' }))

        expect($('input[name="search"]').val()).toBe('Acme')
      })

      test('renders the results count when a search term is present', async () => {
        stubBackendResponse(
          HttpResponse.json(envelope([buildOrg(), buildOrg({ id: 'org-2' })]))
        )

        const { $ } = await loadPage(new URLSearchParams({ search: 'a' }))

        expect($.root().text()).toContain('2 results found')
      })

      test('renders the search-specific empty message when there are no matches', async () => {
        stubBackendResponse(HttpResponse.json(envelope([])))

        const { raw } = await loadPage(
          new URLSearchParams({ search: 'NoSuchOrg' })
        )

        expect(raw).toContain('0 results found')
        expect(raw).toContain('No organisations found matching')
        expect(raw).toContain('NoSuchOrg')
      })

      test('renders the generic empty message when there is no search and no results', async () => {
        stubBackendResponse(HttpResponse.json(envelope([])))

        const { raw } = await loadPage()

        expect(raw).toContain('No organisations found.')
      })
    })

    describe('pagination via query string', () => {
      test('passes page number to the backend', async () => {
        const calls = stubBackendResponse(HttpResponse.json(envelope([])))

        await loadPage(new URLSearchParams({ page: '3' }))

        expect(calls[0].query).toMatchObject({
          page: '3',
          pageSize: '50'
        })
      })

      test('combines page and search params on the backend call', async () => {
        const calls = stubBackendResponse(HttpResponse.json(envelope([])))

        await loadPage(new URLSearchParams({ search: 'acme', page: '2' }))

        expect(calls[0].query).toMatchObject({
          search: 'acme',
          page: '2',
          pageSize: '50'
        })
      })
    })

    describe('pagination component rendering', () => {
      test('does not render pagination when there is a single page of results', async () => {
        stubBackendResponse(
          HttpResponse.json(
            envelope([buildOrg()], { totalItems: 1, totalPages: 1 })
          )
        )

        const { $ } = await loadPage()

        expect($('.govuk-pagination')).toHaveLength(0)
      })

      test('renders Next link when there are more pages', async () => {
        stubBackendResponse(
          HttpResponse.json(
            envelope([buildOrg()], { page: 1, totalItems: 120, totalPages: 3 })
          )
        )

        const { $ } = await loadPage()

        const nextLink = $('.govuk-pagination__next a')
        expect(nextLink).toHaveLength(1)
        const href = nextLink.attr('href')
        expect(href).toContain('page=2')
      })

      test('renders Previous link when on a later page', async () => {
        stubBackendResponse(
          HttpResponse.json(
            envelope([buildOrg()], { page: 2, totalItems: 120, totalPages: 3 })
          )
        )

        const { $ } = await loadPage(new URLSearchParams({ page: '2' }))

        const prevLink = $('.govuk-pagination__prev a')
        expect(prevLink).toHaveLength(1)
        const href = prevLink.attr('href')
        expect(href).toContain('page=1')
      })

      test('does not render Next link when on the last page', async () => {
        stubBackendResponse(
          HttpResponse.json(
            envelope([buildOrg()], { page: 3, totalItems: 120, totalPages: 3 })
          )
        )

        const { $ } = await loadPage(new URLSearchParams({ page: '3' }))

        expect($('.govuk-pagination__next')).toHaveLength(0)
      })

      test('does not render Previous link when on the first page', async () => {
        stubBackendResponse(
          HttpResponse.json(
            envelope([buildOrg()], { page: 1, totalItems: 120, totalPages: 3 })
          )
        )

        const { $ } = await loadPage()

        expect($('.govuk-pagination__prev')).toHaveLength(0)
      })

      test('preserves the search term in pagination links', async () => {
        stubBackendResponse(
          HttpResponse.json(
            envelope([buildOrg()], { page: 1, totalItems: 120, totalPages: 3 })
          )
        )

        const { $ } = await loadPage(new URLSearchParams({ search: 'acme' }))

        const nextHref = $('.govuk-pagination__next a').attr('href')
        expect(nextHref).toContain('search=acme')
        expect(nextHref).toContain('page=2')
      })
    })

    describe('table content', () => {
      test('renders the slim per-organisation projection', async () => {
        stubBackendResponse(HttpResponse.json(envelope([buildOrg()])))

        const { $ } = await loadPage()

        const rowData = $('table tbody tr td')
        expect($(rowData[0]).text()).toEqual('org-1')
        expect($(rowData[1]).text()).toEqual('12345678')
        expect($(rowData[2]).text()).toEqual('REGULATOR-NAME')
        expect($(rowData[3]).find('strong.govuk-tag').text().trim()).toEqual(
          'ACTIVE'
        )
      })

      test('renders the action links unchanged', async () => {
        stubBackendResponse(HttpResponse.json(envelope([buildOrg()])))

        const { $ } = await loadPage()

        const actionLinks = $('table tbody tr td').last().find('a')
        expect(actionLinks).toHaveLength(5)
        expect($(actionLinks[0]).attr('href')).toEqual(
          '/organisations/org-1/overview'
        )
        expect($(actionLinks[1]).attr('href')).toEqual('/organisations/org-1')
      })
    })

    describe('error handling', () => {
      test('shows the 500 error page when the backend returns a non-OK response', async () => {
        mswServer.use(
          http.get(`${config.get('eprBackendUrl')}/v1/organisations`, () =>
            HttpResponse.text('', { status: 500 })
          )
        )

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
      })
    })
  })
})
