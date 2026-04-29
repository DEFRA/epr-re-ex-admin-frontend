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

describe('POST /organisations', () => {
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

  const getCrumb = async () => {
    getUserSession.mockReturnValue(mockUserSession)
    mswServer.use(
      http.get(`${config.get('eprBackendUrl')}/v1/organisations`, () =>
        HttpResponse.json(envelope([]))
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
    const $ = cheerio.load(result)
    return $('input[name="crumb"]').val()
  }

  describe('When user is unauthenticated', () => {
    test('Should return unauthorised status code', async () => {
      const { statusCode } = await server.inject({
        method: 'POST',
        url: '/organisations',
        payload: { search: 'Acme' }
      })

      expect(statusCode).toBe(statusCodes.unauthorised)
    })
  })

  describe('When user is authenticated', () => {
    let crumb

    beforeEach(async () => {
      getUserSession.mockReturnValue(mockUserSession)
      crumb = await getCrumb()
    })

    const submitSearch = async (payload = {}) => {
      const { result, statusCode } = await server.inject({
        method: 'POST',
        url: '/organisations',
        payload: { crumb, ...payload },
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        },
        headers: {
          cookie: `crumb=${crumb}`
        }
      })
      return { $: cheerio.load(result), statusCode, raw: result }
    }

    describe('CSRF protection', () => {
      test('rejects POST without a CSRF token', async () => {
        const { statusCode } = await server.inject({
          method: 'POST',
          url: '/organisations',
          payload: { search: 'Acme' },
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          }
        })

        expect(statusCode).toBe(statusCodes.forbidden)
      })

      test('rejects POST with an invalid CSRF token', async () => {
        const { statusCode } = await server.inject({
          method: 'POST',
          url: '/organisations',
          payload: { search: 'Acme', crumb: 'invalid-token' },
          auth: {
            strategy: 'session',
            credentials: mockUserSession
          },
          headers: { cookie: `crumb=${crumb}` }
        })

        expect(statusCode).toBe(statusCodes.forbidden)
      })
    })

    describe('search submission', () => {
      test('passes search term to the backend with default page and pageSize', async () => {
        const calls = stubBackendResponse(
          HttpResponse.json(envelope([buildOrg()]))
        )

        await submitSearch({ search: 'Acme' })

        expect(calls).toHaveLength(1)
        expect(calls[0].query).toMatchObject({
          search: 'Acme',
          page: '1',
          pageSize: '50'
        })
      })

      test('renders the matching organisations directly (no redirect)', async () => {
        stubBackendResponse(HttpResponse.json(envelope([buildOrg()])))

        const { $, statusCode } = await submitSearch({ search: 'Acme' })

        expect(statusCode).toBe(statusCodes.ok)
        expect($('table tbody tr th').text()).toEqual('Acme Ltd')
      })

      test('preserves the search term in the input field after submission', async () => {
        stubBackendResponse(HttpResponse.json(envelope([buildOrg()])))

        const { $ } = await submitSearch({ search: 'Acme' })

        expect($('input[name="search"]').val()).toBe('Acme')
      })

      test('trims whitespace from the search term before sending to backend', async () => {
        const calls = stubBackendResponse(
          HttpResponse.json(envelope([buildOrg()]))
        )

        await submitSearch({ search: '  Acme  ' })

        expect(calls[0].query.search).toBe('Acme')
      })

      test('omits search param when the submitted search is empty or whitespace', async () => {
        const calls = stubBackendResponse(
          HttpResponse.json(envelope([buildOrg()]))
        )

        await submitSearch({ search: '   ' })

        expect(calls[0].query.search).toBeUndefined()
        expect(calls[0].query).toMatchObject({
          page: '1',
          pageSize: '50'
        })
      })

      test('always requests page 1 regardless of any submitted page payload', async () => {
        const calls = stubBackendResponse(
          HttpResponse.json(envelope([buildOrg()]))
        )

        await submitSearch({ search: 'Acme', page: '5' })

        expect(calls[0].query.page).toBe('1')
      })

      test('renders the no-results message when search yields nothing', async () => {
        stubBackendResponse(HttpResponse.json(envelope([])))

        const { raw } = await submitSearch({ search: 'NoSuchOrg' })

        expect(raw).toContain('0 results found')
        expect(raw).toContain('No organisations found matching')
        expect(raw).toContain('NoSuchOrg')
      })
    })

    describe('pagination links after POST', () => {
      test('builds pagination links as GET URLs preserving the search term', async () => {
        stubBackendResponse(
          HttpResponse.json(
            envelope([buildOrg()], { page: 1, totalItems: 120, totalPages: 3 })
          )
        )

        const { $ } = await submitSearch({ search: 'Acme' })

        const nextHref = $('.govuk-pagination__next a').attr('href')
        expect(nextHref).toContain('search=Acme')
        expect(nextHref).toContain('page=2')
        expect(nextHref).toMatch(/^\/organisations/)
      })
    })
  })
})
