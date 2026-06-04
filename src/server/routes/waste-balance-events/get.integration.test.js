import { config } from '#config/config.js'
import { statusCodes } from '#server/common/constants/status-codes.js'
import { getUserSession } from '#server/common/helpers/auth/get-user-session.js'
import { mockUserSession } from '#server/common/test-helpers/fixtures.js'
import { createMockOidcServer } from '#server/common/test-helpers/mock-oidc.js'
import { createServer } from '#server/server.js'
import { http, HttpResponse, server as mswServer } from '#vite/setup-msw.js'
import {
  getAllByRole,
  getByRole,
  getByText,
  queryByRole
} from '@testing-library/dom'
import { Window } from 'happy-dom'
import { vi } from 'vitest'

vi.mock('#server/common/helpers/auth/get-user-session.js', () => ({
  getUserSession: vi.fn().mockReturnValue(null)
}))

describe('#wasteBalanceEventsController', () => {
  const originalBackendUrl = config.get('eprBackendUrl')
  const backendUrl = 'http://mock-backend'
  const organisationId = '69c3b4f0abda9efa68dd6697'
  const registrationId = 'reg-001'
  const accreditationId = '69c3b4f0abda9efa68dd6698'
  const url = `/organisations/${organisationId}/registrations/${registrationId}/accreditations/${accreditationId}/waste-balance-events`
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

  /** @type {{ id: string, companyName: string, registrations: Array<{ id: string, registrationNumber: string, status: string, processingType: string, material: string, site: string, accreditation: { id: string, accreditationNumber: string, status: string } | null }> }} */
  const mockOverview = {
    id: organisationId,
    companyName: 'ACME ltd',
    registrations: [
      {
        id: 'reg-001',
        registrationNumber: 'REG-50030-001',
        status: 'approved',
        processingType: 'reprocessing',
        material: 'glass',
        site: 'Site A',
        accreditation: {
          id: accreditationId,
          accreditationNumber: 'ACC-50030-001',
          status: 'approved'
        }
      }
    ]
  }

  const mockOverviewNoMatchingRegistration = {
    id: organisationId,
    companyName: 'ACME ltd',
    registrations: []
  }

  const mockEvents = [
    {
      id: 'evt-1',
      registrationId: 'reg-001',
      accreditationId,
      organisationId,
      number: 1,
      kind: 'SUMMARY_LOG_SUBMITTED',
      payload: { summaryLogId: 'sl-1', creditTotal: 100 },
      openingBalance: { amount: 0, availableAmount: 0 },
      closingBalance: { amount: 100, availableAmount: 100 },
      createdAt: '2026-01-15T10:00:00.000Z',
      createdBy: {
        id: 'user-1',
        name: 'Test User',
        email: 'test.user@example.com'
      }
    },
    {
      id: 'evt-2',
      registrationId: 'reg-001',
      accreditationId,
      organisationId,
      number: 2,
      kind: 'PRN_CREATED',
      payload: { prnId: 'prn-1', amount: 50 },
      openingBalance: { amount: 100, availableAmount: 100 },
      closingBalance: { amount: 100, availableAmount: 50 },
      createdAt: '2026-01-16T14:30:00.000Z',
      createdBy: { id: 'user-1', name: 'Test User' }
    }
  ]

  const renderPage = (html) => {
    const window = new Window()
    window.document.body.innerHTML = html
    return /** @type {HTMLElement} */ (
      /** @type {unknown} */ (window.document.body)
    )
  }

  const getEventsTable = (container) =>
    getByRole(container, 'table', { name: 'Waste balance events' })

  const getDataRows = (table) => getAllByRole(table, 'row').slice(1)

  const useMockBackend = (
    overviewResponse = mockOverview,
    eventsResponse = mockEvents
  ) => {
    mswServer.use(
      http.get(
        `${backendUrl}/v1/organisations/${organisationId}/overview`,
        () => HttpResponse.json(overviewResponse)
      ),
      http.get(
        `${backendUrl}/v1/admin/registrations/reg-001/accreditations/${accreditationId}/waste-balance-events`,
        () => HttpResponse.json(eventsResponse)
      )
    )
  }

  describe('When user is unauthenticated', () => {
    test('Should return unauthorised status code', async () => {
      const { statusCode } = await server.inject({ method: 'GET', url })

      expect(statusCode).toBe(statusCodes.unauthorised)
    })
  })

  describe('When user is authenticated', () => {
    beforeAll(() => {
      vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
    })

    test('Should return OK', async () => {
      useMockBackend()

      const { statusCode } = await server.inject({
        method: 'GET',
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      expect(statusCode).toBe(statusCodes.ok)
    })

    test('Should render the heading with company name and accreditation number', async () => {
      useMockBackend()

      const { result } = await server.inject({
        method: 'GET',
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      const body = renderPage(result)

      expect(getByRole(body, 'heading', { level: 1 })).toHaveTextContent(
        'ACME ltd - ACC-50030-001'
      )
    })

    test('Should return 404 when registration is not found', async () => {
      useMockBackend(mockOverviewNoMatchingRegistration)

      const { statusCode } = await server.inject({
        method: 'GET',
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      expect(statusCode).toBe(statusCodes.notFound)
    })

    test('Should render breadcrumbs back to registration overview', async () => {
      useMockBackend()

      const { result } = await server.inject({
        method: 'GET',
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      const body = renderPage(result)
      const breadcrumbs = getByRole(body, 'navigation', {
        name: 'Breadcrumb'
      })

      expect(
        getAllByRole(breadcrumbs, 'link').map((l) => ({
          text: l.textContent?.trim(),
          href: l.getAttribute('href')
        }))
      ).toEqual([
        { text: 'Organisations', href: '/organisations' },
        {
          text: 'Organisation overview',
          href: `/organisations/${organisationId}/overview`
        },
        {
          text: 'Registration overview',
          href: `/organisations/${organisationId}/registrations/reg-001/overview`
        }
      ])
    })

    test('Should render events table with correct columns', async () => {
      useMockBackend()

      const { result } = await server.inject({
        method: 'GET',
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      const body = renderPage(result)

      expect(
        getAllByRole(getEventsTable(body), 'columnheader').map((h) =>
          h.textContent?.trim()
        )
      ).toEqual([
        'Number',
        'Kind',
        'Date',
        'Created by',
        'Email',
        'Payload',
        'Closing balance',
        'Closing available'
      ])
    })

    test('Should render event rows with correct data', async () => {
      useMockBackend()

      const { result } = await server.inject({
        method: 'GET',
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      const body = renderPage(result)
      const rows = getDataRows(getEventsTable(body))

      expect(rows).toHaveLength(2)

      const firstCells = getAllByRole(rows[0], 'cell')
      expect(firstCells[0]).toHaveTextContent('1')
      expect(firstCells[1]).toHaveTextContent('SUMMARY_LOG_SUBMITTED')
      expect(firstCells[3]).toHaveTextContent('Test User')
      expect(firstCells[4]).toHaveTextContent('test.user@example.com')
      expect(firstCells[6]).toHaveTextContent('100')
      expect(firstCells[7]).toHaveTextContent('100')

      const secondCells = getAllByRole(rows[1], 'cell')
      expect(secondCells[0]).toHaveTextContent('2')
      expect(secondCells[1]).toHaveTextContent('PRN_CREATED')
      expect(secondCells[3]).toHaveTextContent('Test User')
      expect(secondCells[4]).toBeEmptyDOMElement()
      expect(secondCells[6]).toHaveTextContent('100')
      expect(secondCells[7]).toHaveTextContent('50')
    })

    test('Should render empty string for name and email when createdBy fields are absent', async () => {
      useMockBackend(mockOverview, [
        {
          id: 'evt-3',
          registrationId: 'reg-001',
          accreditationId,
          organisationId,
          number: 3,
          kind: 'PRN_CREATED',
          payload: { prnId: 'prn-2', amount: 10 },
          openingBalance: { amount: 50, availableAmount: 50 },
          closingBalance: { amount: 50, availableAmount: 40 },
          createdAt: '2026-01-17T09:00:00.000Z',
          createdBy: { id: 'user-2', name: undefined, email: undefined }
        }
      ])

      const { result } = await server.inject({
        method: 'GET',
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      const body = renderPage(result)
      const rows = getDataRows(getEventsTable(body))
      const cells = getAllByRole(rows[0], 'cell')

      expect(cells[3]).toBeEmptyDOMElement()
      expect(cells[4]).toBeEmptyDOMElement()
    })

    test('Should render "No waste balance events" when events list is empty', async () => {
      useMockBackend(mockOverview, [])

      const { result } = await server.inject({
        method: 'GET',
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      const body = renderPage(result)

      expect(
        queryByRole(body, 'table', { name: 'Waste balance events' })
      ).toBeNull()
      expect(getByText(body, 'No waste balance events')).toBeInTheDocument()
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
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      const body = renderPage(result)

      expect(
        getByText(body, 'Sorry, there is a problem with the service')
      ).toBeInTheDocument()
    })
  })
})
