import { vi } from 'vitest'
import { createServer } from '#server/server.js'
import { config } from '#config/config.js'
import { statusCodes } from '#server/common/constants/status-codes.js'
import { mockUserSession } from '#server/common/test-helpers/fixtures.js'
import { getUserSession } from '#server/common/helpers/auth/get-user-session.js'
import { createMockOidcServer } from '#server/common/test-helpers/mock-oidc.js'
import {
  http,
  server as mswServer,
  HttpResponse
} from '../../../../.vite/setup-msw.js'
import * as cheerio from 'cheerio'

vi.mock('#server/common/helpers/auth/get-user-session.js', () => ({
  getUserSession: vi.fn().mockReturnValue(null)
}))

describe('GET /system-logs', () => {
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
    // Ensure any stubbed globals are reset after each test
    if (typeof vi.unstubAllGlobals === 'function') {
      vi.unstubAllGlobals()
    }
  })

  const stubBackendReponse = (response) => {
    const calls = []
    mswServer.use(
      http.get(
        `${config.get('eprBackendUrl')}/v1/system-logs`,
        ({ request }) => {
          const url = new URL(request.url)
          calls.push({ url })
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
        url: '/system-logs'
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
        ? `/system-logs?${queryParams}`
        : '/system-logs'
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url,
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        }
      })

      return { $: cheerio.load(result), statusCode }
    }

    test('Should return OK and render system logs', async () => {
      stubBackendReponse(
        HttpResponse.json({
          systemLogs: [
            {
              createdAt: '2025-01-02T09:00:00Z',
              createdBy: { email: 'user1@email.com' },
              event: {
                category: 'cat-1',
                subCategory: 'sub-cat-1',
                action: 'action-1'
              },
              context: {}
            },
            {
              createdAt: '2025-02-03T10:00:00Z',
              createdBy: { email: 'user2@email.com' },
              event: {
                category: 'cat-2',
                subCategory: 'sub-cat-2',
                action: 'action-2'
              },
              context: {}
            }
          ]
        })
      )

      const { $, statusCode } = await loadPage()

      expect(statusCode).toBe(statusCodes.ok)

      const rendered = $.extract({
        pageTitle: 'h1',
        summaryLogTitles: ['h2.govuk-summary-card__title'],
        summaryLogs: ['.govuk-summary-card']
      })

      expect(rendered.pageTitle).toEqual('System logs')

      expect(rendered.summaryLogTitles).toHaveLength(2)
      expect(rendered.summaryLogs).toHaveLength(2)
      expect(rendered.summaryLogTitles[0].trim()).toEqual(
        'cat-1, sub-cat-1, action-1'
      )
      expect(rendered.summaryLogs[0]).toContain('2025-01-02T09:00:00Z')
      expect(rendered.summaryLogs[0]).toContain('user1@email.com')
      expect(rendered.summaryLogTitles[1].trim()).toEqual(
        'cat-2, sub-cat-2, action-2'
      )
      expect(rendered.summaryLogs[1]).toContain('2025-02-03T10:00:00Z')
      expect(rendered.summaryLogs[1]).toContain('user2@email.com')
    })

    describe('summary-log rendering', () => {
      it('includes context.previous and context.next in <details> elements', async () => {
        stubBackendReponse(
          HttpResponse.json({
            systemLogs: [
              {
                createdBy: {},
                event: {},
                context: {
                  previous: { version: 1, title: 'A', subTitle: 'a' },
                  next: { version: 2, title: 'A', subTitle: 'a2' }
                }
              }
            ]
          })
        )

        const { $, statusCode } = await loadPage()

        expect(statusCode).toBe(statusCodes.ok)

        const normalise = (textWithWhitespace) =>
          textWithWhitespace.replace(/[\s|\n]+/g, ' ').trim()

        const previousRow = $(
          '.govuk-summary-card .govuk-summary-list__row'
        ).has('dt:contains("Previous")')

        expect(
          normalise(
            $(previousRow).find('dd details .govuk-details__text').html()
          )
        ).toEqual(
          '<code class="app-json-display"> { "version": 1, "title": "A", "subTitle": "a" }</code>'
        )

        const nextRow = $('.govuk-summary-card .govuk-summary-list__row').has(
          'dt:contains("Next")'
        )

        expect(
          normalise($(nextRow).find('dd details .govuk-details__text').html())
        ).toEqual(
          '<code class="app-json-display"> { "version": 2, "title": "A", "subTitle": "a2" }</code>'
        )
      })

      it.each([
        [
          'strings',
          {
            previous: 'a',
            next: 'b',
            expectedDifference: { '0': 'a -> b' }
          }
        ],
        [
          'multiple keys different',
          {
            previous: { id: 1, item: 'a', another: 'same' },
            next: { id: 2, item: 'b', another: 'same' },
            expectedDifference: { id: '1 -> 2', item: 'a -> b' }
          }
        ],
        [
          'keys added',
          {
            previous: { id: 1 },
            next: { id: 1, item: 'a' },
            expectedDifference: { item: '(added) a' }
          }
        ],
        [
          'keys removed',
          {
            previous: { id: 1, item: 'a' },
            next: { id: 1 },
            expectedDifference: {} // TODO should be { item: '(removed) a' }
          }
        ],
        [
          'nested keys different',
          {
            previous: { id: 1, nested: { item: 'a', another: 'same' } },
            next: { id: 1, nested: { item: 'b', another: 'same' } },
            expectedDifference: { nested: { item: 'a -> b' } }
          }
        ],
        [
          'nested arrays element added',
          {
            previous: { id: 1, nested: { items: ['a'] } },
            next: { id: 1, nested: { items: ['a', 'b'] } },
            expectedDifference: { nested: { items: ['(added) b'] } }
          }
        ],
        [
          'nested arrays element removed',
          {
            previous: { id: 1, nested: { items: ['a', 'b'] } },
            next: { id: 1, nested: { items: ['b'] } },
            expectedDifference: { nested: { items: ['a -> b'] } }
          }
        ],
        [
          'nested arrays element order changed',
          {
            previous: { id: 1, nested: { items: ['a', 'b'] } },
            next: { id: 1, nested: { items: ['b', 'a'] } },
            expectedDifference: { nested: { items: ['a -> b', 'b -> a'] } }
          }
        ],
        [
          'nested arrays of objects changed',
          {
            previous: {
              id: 1,
              nested: { items: [{ title: 'a', sub: 'subtitle' }] }
            },
            next: {
              id: 1,
              nested: { items: [{ title: 'b', sub: 'subtitle' }] }
            },
            expectedDifference: { nested: { items: [{ title: 'a -> b' }] } }
          }
        ],
        [
          'nested arrays of objects added',
          {
            previous: {
              id: 1,
              nested: { items: [{ title: 'a', sub: 'subtitle' }] }
            },
            next: {
              id: 1,
              nested: { items: [{ title: 'a', sub: 'subtitle' }, { title: 'b', sub: 'subtitle' }] }
            },
            expectedDifference: { nested: { items: [['(added)', { title: 'b', sub: 'subtitle' }]] } }
          }
        ],
        [
          'nested arrays of objects removed',
          {
            previous: {
              id: 1,
              nested: { items: [{ title: 'a', sub: 'subtitle' }] }
            },
            next: {
              id: 1,
              nested: { items: [] }
            },
            expectedDifference: { nested: { items: [] } } // TODO should describe removed item
          }
        ]
      ])(
        'Renders the difference between previous and next - %s',
        async (_description, { previous, next, expectedDifference }) => {
          stubBackendReponse(
            HttpResponse.json({
              systemLogs: [
                {
                  createdBy: {},
                  event: {},
                  context: { previous, next }
                }
              ]
            })
          )

          const { $, statusCode } = await loadPage()

          expect(statusCode).toBe(statusCodes.ok)

          const differenceRow = $(
            '.govuk-summary-card .govuk-summary-list__row'
          ).has('dt:contains("Difference")')

          const diff = JSON.parse(
            differenceRow.find('dd.govuk-summary-list__value').text()
          )
          expect(diff).toEqual(expectedDifference)
        }
      )
    })

    describe('search paramaters', () => {
      it('uses the supplied referenceNumber as organisationId when calling the backend', async () => {
        const backendCalls = stubBackendReponse(
          HttpResponse.json({
            systemLogs: [
              {
                createdBy: {},
                event: {},
                context: {}
              }
            ]
          })
        )

        const { $, statusCode } = await loadPage(
          new URLSearchParams({ referenceNumber: 12345 })
        )

        expect(statusCode).toEqual(statusCodes.ok)

        // backend called with expected query
        expect(backendCalls).toHaveLength(1)
        expect(backendCalls[0].url.searchParams).toEqual(
          new URLSearchParams({ organisationId: 12345 })
        )

        // reference Number rendered in search form
        expect($('form input[name=referenceNumber]').val()).toEqual('12345')
      })
    })

    test('Should render not authorised page when backend request is not authorised', async () => {
      stubBackendReponse(
        HttpResponse.json(
          { error: 'Not Authorized' },
          { status: statusCodes.unauthorised }
        )
      )

      const { $, statusCode } = await loadPage()

      expect(statusCode).toBe(statusCodes.unauthorised)
      expect($('h1').text().trim()).toEqual('Unauthorised')
    })

    test('Should render page with no data when backend fetch throws', async () => {
      stubBackendReponse(
        HttpResponse.json(
          { error: 'Server error' },
          { status: statusCodes.internalServerError }
        )
      )

      const { $, statusCode } = await loadPage()

      expect(statusCode).toBe(statusCodes.internalServerError)
      expect($.text()).toContain('Sorry, there is a problem with the service')
    })
  })
})
