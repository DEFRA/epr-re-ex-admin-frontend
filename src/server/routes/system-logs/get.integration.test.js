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
  })

  const stubBackendResponse = (response) => {
    const calls = []
    mswServer.use(
      http.get(
        `${config.get('eprBackendUrl')}/v1/system-logs/search`,
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
        url: '/system-logs'
      })

      expect(statusCode).toBe(statusCodes.unauthorised)
      expect(result).toEqual(expect.stringContaining('Unauthorised'))
    })
  })

  describe('When user is authenticated', () => {
    beforeEach(() => {
      vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
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

    test('Should return OK and render initial empty state when no search term is provided', async () => {
      const { $, statusCode } = await loadPage()

      expect(statusCode).toBe(statusCodes.ok)
      expect($('h1').text()).toEqual('System logs')
      expect($('.govuk-summary-card')).toHaveLength(0)
    })

    test('Should return OK and render system logs', async () => {
      stubBackendResponse(
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

      const { $, statusCode } = await loadPage(
        new URLSearchParams({ referenceNumber: 'ORG-123' })
      )

      expect(statusCode).toBe(statusCodes.ok)

      const rendered = $.extract({
        pageTitle: 'h1',
        systemLogTitles: ['h2.govuk-summary-card__title'],
        systemLogs: ['.govuk-summary-card']
      })

      expect(rendered.pageTitle).toEqual('System logs')

      expect(rendered.systemLogTitles).toHaveLength(2)
      expect(rendered.systemLogs).toHaveLength(2)
      expect(rendered.systemLogTitles[0].trim()).toEqual(
        'cat-1, sub-cat-1, action-1'
      )
      expect(rendered.systemLogs[0]).toContain('2025-01-02T09:00:00Z')
      expect(rendered.systemLogs[0]).toContain('user1@email.com')
      expect(rendered.systemLogTitles[1].trim()).toEqual(
        'cat-2, sub-cat-2, action-2'
      )
      expect(rendered.systemLogs[1]).toContain('2025-02-03T10:00:00Z')
      expect(rendered.systemLogs[1]).toContain('user2@email.com')
    })

    describe('download link rendering', () => {
      const systemLogWithFile = {
        createdBy: {},
        event: {},
        context: {
          summaryLogId: 'sl-789',
          organisationId: 'org-123',
          registrationId: 'reg-456'
        }
      }

      it('renders a download link when context has summaryLogId', async () => {
        stubBackendResponse(
          HttpResponse.json({
            systemLogs: [systemLogWithFile]
          })
        )

        const { $, statusCode } = await loadPage(
          new URLSearchParams({ referenceNumber: 'ORG-123' })
        )

        expect(statusCode).toBe(statusCodes.ok)

        const downloadLink = $(
          'a[href="/system-logs/download/org-123/reg-456/sl-789"]'
        )
        expect(downloadLink).toHaveLength(1)
        expect(downloadLink.text().trim()).toBe('Download file')
      })

      it('does not render a download link when context has no summaryLogId', async () => {
        stubBackendResponse(
          HttpResponse.json({
            systemLogs: [
              {
                createdBy: {},
                event: {},
                context: {
                  someOtherField: 'value'
                }
              }
            ]
          })
        )

        const { $, statusCode } = await loadPage(
          new URLSearchParams({ referenceNumber: 'ORG-123' })
        )

        expect(statusCode).toBe(statusCodes.ok)

        const downloadLink = $('a[href*="/system-logs/download/"]')
        expect(downloadLink).toHaveLength(0)
      })
    })

    describe('generic system-log rendering', () => {
      it('displays the context data', async () => {
        const contextData = {
          a: 'bit of data',
          b: { some: 'more-data' }
        }
        stubBackendResponse(
          HttpResponse.json({
            systemLogs: [
              {
                createdBy: {},
                event: {},
                context: contextData
              }
            ]
          })
        )

        const { $, statusCode } = await loadPage(
          new URLSearchParams({ referenceNumber: 'ORG-123' })
        )

        expect(statusCode).toBe(statusCodes.ok)

        const contextRow = $(
          '.govuk-summary-card .govuk-summary-list__row'
        ).has('dt:contains("Context")')

        const contextHtml = contextRow
          .find('dd.govuk-summary-list__value')
          .text()
        const renderedContext = contextHtml ? JSON.parse(contextHtml) : ''

        expect(renderedContext).toEqual(contextData)
      })
    })

    describe('system log with previous & next rendering', () => {
      it('includes context.previous and context.next in <details> elements', async () => {
        stubBackendResponse(
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

        const { $, statusCode } = await loadPage(
          new URLSearchParams({ referenceNumber: 'ORG-123' })
        )

        expect(statusCode).toBe(statusCodes.ok)

        const normalise = (textWithWhitespace) =>
          textWithWhitespace
            ? textWithWhitespace.replace(/[\s|\n]+/g, ' ').trim()
            : ''

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
          'primitive unchanged',
          {
            previous: 'a',
            next: 'a',
            expectedDifference: 'no differences'
          }
        ],
        [
          'primitive changed',
          {
            previous: 'a',
            next: 'b',
            expectedDifference: { _changed: 'a -> b' }
          }
        ],
        [
          'primitive type and value',
          {
            previous: 'a',
            next: { something: 'else' },
            expectedDifference: { _previous: 'a', _next: { something: 'else' } }
          }
        ],
        [
          'primitive added',
          {
            previous: '',
            next: 'b',
            expectedDifference: { _added: 'b' }
          }
        ],
        [
          'primitive removed',
          {
            previous: 'a',
            next: '',
            expectedDifference: { _removed: 'a' }
          }
        ],
        [
          'keys unchanged',
          {
            previous: { id: 1, item: 'a', another: 'same' },
            next: { id: 1, item: 'a', another: 'same' },
            expectedDifference: 'no differences'
          }
        ],
        [
          'keys changed',
          {
            previous: { id: 1, item: 'a', another: 'same' },
            next: { id: 2, item: 'b', another: 'same' },
            expectedDifference: {
              id: { _changed: '1 -> 2' },
              item: { _changed: 'a -> b' }
            }
          }
        ],
        [
          'keys type and value changed',
          {
            previous: { id: 1, item: 'a', another: 'same' },
            next: { id: 2, item: { nested: 'value' }, another: 'same' },
            expectedDifference: {
              id: { _changed: '1 -> 2' },
              item: { _previous: 'a', _next: { nested: 'value' } }
            }
          }
        ],
        [
          'keys added',
          {
            previous: { id: 1 },
            next: { id: 1, item: 'a' },
            expectedDifference: { item: { _added: 'a' } }
          }
        ],
        [
          'keys removed',
          {
            previous: { id: 1, one: 'a', two: 'b' },
            next: { id: 1, two: '' },
            expectedDifference: {
              one: { _removed: 'a' },
              two: { _removed: 'b' }
            }
          }
        ],
        [
          'nested keys changed',
          {
            previous: { id: 1, nested: { item: 'a', another: 'same' } },
            next: { id: 1, nested: { item: 'b', another: 'same' } },
            expectedDifference: { nested: { item: { _changed: 'a -> b' } } }
          }
        ],
        [
          'nested arrays element added',
          {
            previous: { id: 1, nested: { items: ['a'] } },
            next: { id: 1, nested: { items: ['a', 'b'] } },
            expectedDifference: { nested: { items: { 1: { _added: 'b' } } } }
          }
        ],
        [
          'nested arrays element removed',
          {
            previous: { id: 1, nested: { items: ['a', 'b'] } },
            next: { id: 1, nested: { items: ['b'] } },
            expectedDifference: {
              nested: {
                items: { 0: { _changed: 'a -> b' }, 1: { _removed: 'b' } }
              }
            }
          }
        ],
        [
          'nested arrays element order changed',
          {
            previous: { id: 1, nested: { items: ['a', 'b'] } },
            next: { id: 1, nested: { items: ['b', 'a'] } },
            expectedDifference: {
              nested: {
                items: { 0: { _changed: 'a -> b' }, 1: { _changed: 'b -> a' } }
              }
            }
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
            expectedDifference: {
              nested: { items: { 0: { title: { _changed: 'a -> b' } } } }
            }
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
              nested: {
                items: [
                  { title: 'a', sub: 'subtitle' },
                  { title: 'b', sub: 'subtitle' }
                ]
              }
            },
            expectedDifference: {
              nested: {
                items: { 1: { _added: { title: 'b', sub: 'subtitle' } } }
              }
            }
          }
        ],
        [
          'nested arrays of objects last removed',
          {
            previous: {
              id: 1,
              nested: { items: [{ title: 'a' }, { title: 'b' }] }
            },
            next: {
              id: 1,
              nested: { items: [{ title: 'a' }] }
            },
            expectedDifference: {
              nested: { items: { 1: { _removed: { title: 'b' } } } }
            }
          }
        ],
        [
          'nested arrays of objects first removed',
          {
            previous: {
              id: 1,
              nested: { items: [{ title: 'a' }, { title: 'b' }] }
            },
            next: {
              id: 1,
              nested: { items: [{ title: 'b' }] }
            },
            expectedDifference: {
              nested: {
                items: {
                  0: { title: { _changed: 'a -> b' } },
                  1: { _removed: { title: 'b' } }
                }
              }
            }
          }
        ]
      ])(
        'Renders the difference between previous and next - %s',
        async (_description, { previous, next, expectedDifference }) => {
          stubBackendResponse(
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

          const { $, statusCode } = await loadPage(
            new URLSearchParams({ referenceNumber: 'ORG-123' })
          )

          expect(statusCode).toBe(statusCodes.ok)

          const differenceRow = $(
            '.govuk-summary-card .govuk-summary-list__row'
          ).has('dt:contains("Difference")')

          const diffHtml = differenceRow
            .find('dd.govuk-summary-list__value')
            .text()
          const diff = diffHtml ? JSON.parse(diffHtml) : ''

          expect(diff).toEqual(expectedDifference)
        }
      )

      it.each([
        [
          'only previous is present',
          { previous: { value: 1 } },
          { rendered: 'Previous', notRendered: 'Next' }
        ],
        [
          'only next is present',
          { next: { value: 2 } },
          { rendered: 'Next', notRendered: 'Previous' }
        ]
      ])(
        'does not render the difference row when %s',
        async (_description, context, { rendered, notRendered }) => {
          stubBackendResponse(
            HttpResponse.json({
              systemLogs: [
                {
                  createdBy: {},
                  event: {},
                  context
                }
              ]
            })
          )

          const { $, statusCode } = await loadPage(
            new URLSearchParams({ referenceNumber: 'ORG-123' })
          )

          expect(statusCode).toBe(statusCodes.ok)

          const renderedRow = $(
            '.govuk-summary-card .govuk-summary-list__row'
          ).has(`dt:contains("${rendered}")`)
          expect(renderedRow).toHaveLength(1)

          const notRenderedRow = $(
            '.govuk-summary-card .govuk-summary-list__row'
          ).has(`dt:contains("${notRendered}")`)
          expect(notRenderedRow).toHaveLength(0)

          const differenceRow = $(
            '.govuk-summary-card .govuk-summary-list__row'
          ).has('dt:contains("Difference")')
          expect(differenceRow).toHaveLength(0)
        }
      )
    })

    describe('search parameters', () => {
      it('passes referenceNumber to the backend as organisationId', async () => {
        const backendCalls = stubBackendResponse(
          HttpResponse.json({
            systemLogs: [{ createdBy: {}, event: {}, context: {} }],
            hasNext: false,
            hasPrev: false
          })
        )

        const { $, statusCode } = await loadPage(
          new URLSearchParams({ referenceNumber: '12345' })
        )

        expect(statusCode).toEqual(statusCodes.ok)
        expect(backendCalls).toHaveLength(1)
        expect(backendCalls[0].query).toEqual({ organisationId: '12345' })
        expect($('form input[name=referenceNumber]').val()).toEqual('12345')
      })

      it('passes userId to the backend and rehydrates it in the form', async () => {
        const backendCalls = stubBackendResponse(
          HttpResponse.json({
            systemLogs: [{ createdBy: {}, event: {}, context: {} }],
            hasNext: false,
            hasPrev: false
          })
        )

        const { $, statusCode } = await loadPage(
          new URLSearchParams({ userId: 'user-abc-123' })
        )

        expect(statusCode).toEqual(statusCodes.ok)
        expect(backendCalls).toHaveLength(1)
        expect(backendCalls[0].query).toEqual({ userId: 'user-abc-123' })
        expect($('form input[name=userId]').val()).toEqual('user-abc-123')
      })

      it('passes all three filters to the backend together', async () => {
        const backendCalls = stubBackendResponse(
          HttpResponse.json({ systemLogs: [], hasNext: false, hasPrev: false })
        )

        await loadPage(
          new URLSearchParams({
            referenceNumber: 'ORG-1',
            userId: 'user-1',
            subCategory: 'reports'
          })
        )

        expect(backendCalls[0].query).toEqual({
          organisationId: 'ORG-1',
          userId: 'user-1',
          subCategory: 'reports'
        })
      })

      it('shows a validation error and does not call the backend when the form is submitted empty', async () => {
        const backendCalls = stubBackendResponse(
          HttpResponse.json({ systemLogs: [] })
        )

        const { $, statusCode } = await loadPage(
          new URLSearchParams({
            referenceNumber: '',
            userId: '',
            subCategory: ''
          })
        )

        expect(statusCode).toEqual(statusCodes.ok)
        expect(backendCalls).toHaveLength(0)
        expect($.text()).toContain('There is a problem')
        expect($.text()).toContain(
          'Enter an organisation reference number, user ID or event type'
        )
      })
    })

    describe('pagination', () => {
      it('passes cursor and direction to the backend when provided', async () => {
        const backendCalls = stubBackendResponse(
          HttpResponse.json({ systemLogs: [], hasNext: false, hasPrev: false })
        )

        await loadPage(
          new URLSearchParams({
            referenceNumber: '12345',
            cursor: 'abc123def456abc123def456',
            direction: 'next'
          })
        )

        expect(backendCalls).toHaveLength(1)
        expect(backendCalls[0].query).toEqual({
          organisationId: '12345',
          cursor: 'abc123def456abc123def456',
          direction: 'next'
        })
      })

      it('passes direction=prev to the backend when provided', async () => {
        const backendCalls = stubBackendResponse(
          HttpResponse.json({ systemLogs: [], hasNext: false, hasPrev: false })
        )

        await loadPage(
          new URLSearchParams({
            referenceNumber: '12345',
            cursor: 'abc123def456abc123def456',
            direction: 'prev'
          })
        )

        expect(backendCalls).toHaveLength(1)
        expect(backendCalls[0].query).toEqual({
          organisationId: '12345',
          cursor: 'abc123def456abc123def456',
          direction: 'prev'
        })
      })

      it('renders a Next link carrying all filters and the forward cursor', async () => {
        stubBackendResponse(
          HttpResponse.json({
            systemLogs: [{ createdBy: {}, event: {}, context: {} }],
            hasNext: true,
            hasPrev: false,
            nextCursor: 'aaa111bbb222ccc333ddd444'
          })
        )

        const { $ } = await loadPage(
          new URLSearchParams({
            referenceNumber: '12345',
            userId: 'user-9',
            subCategory: 'reports'
          })
        )

        const href = $('.govuk-pagination__next a').attr('href')
        expect(href).toContain('referenceNumber=12345')
        expect(href).toContain('userId=user-9')
        expect(href).toContain('subCategory=reports')
        expect(href).toContain('cursor=aaa111bbb222ccc333ddd444')
        expect(href).toContain('direction=next')
      })

      it('renders a Previous link carrying all filters and the backward cursor', async () => {
        stubBackendResponse(
          HttpResponse.json({
            systemLogs: [{ createdBy: {}, event: {}, context: {} }],
            hasNext: false,
            hasPrev: true,
            prevCursor: 'eee555fff666aaa777bbb888'
          })
        )

        const { $ } = await loadPage(
          new URLSearchParams({
            referenceNumber: '12345',
            cursor: 'abc123def456abc123def456',
            direction: 'next'
          })
        )

        const href = $('.govuk-pagination__prev a').attr('href')
        expect(href).toContain('referenceNumber=12345')
        expect(href).toContain('cursor=eee555fff666aaa777bbb888')
        expect(href).toContain('direction=prev')
      })

      it('does not render pagination for a single page of results', async () => {
        stubBackendResponse(
          HttpResponse.json({
            systemLogs: [{ createdBy: {}, event: {}, context: {} }],
            hasNext: false,
            hasPrev: false
          })
        )

        const { $ } = await loadPage(
          new URLSearchParams({ referenceNumber: '12345' })
        )

        expect($('.govuk-pagination')).toHaveLength(0)
      })

      it('never includes an email address in a pagination link', async () => {
        stubBackendResponse(
          HttpResponse.json({
            systemLogs: [
              {
                createdBy: { email: 'alice@example.com' },
                event: {},
                context: {}
              }
            ],
            hasNext: true,
            hasPrev: false,
            nextCursor: 'aaa111bbb222ccc333ddd444'
          })
        )

        const { $ } = await loadPage(new URLSearchParams({ userId: 'user-9' }))

        const href = $('.govuk-pagination__next a').attr('href')
        expect(href).not.toContain('@')
        expect(href).not.toContain('alice')
      })
    })

    test('Should render not authorised page when backend request is not authorised', async () => {
      stubBackendResponse(
        HttpResponse.json(
          { error: 'Not Authorized' },
          { status: statusCodes.unauthorised }
        )
      )

      const { $, statusCode } = await loadPage(
        new URLSearchParams({ referenceNumber: 'ORG-123' })
      )

      expect(statusCode).toBe(statusCodes.unauthorised)
      expect($('h1').text().trim()).toEqual('Unauthorised')
    })

    test('Should render page with no data when backend fetch throws', async () => {
      stubBackendResponse(
        HttpResponse.json(
          { error: 'Server error' },
          { status: statusCodes.internalServerError }
        )
      )

      const { $, statusCode } = await loadPage(
        new URLSearchParams({ referenceNumber: 'ORG-123' })
      )

      expect(statusCode).toBe(statusCodes.internalServerError)
      expect($.text()).toContain('Sorry, there is a problem with the service')
    })
  })
})
