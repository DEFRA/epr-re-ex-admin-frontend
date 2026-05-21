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
  queryByRole,
  queryByText,
  within
} from '@testing-library/dom'
import { Window } from 'happy-dom'
import { vi } from 'vitest'

vi.mock('#server/common/helpers/auth/get-user-session.js', () => ({
  getUserSession: vi.fn().mockReturnValue(null)
}))

describe('#registrationOverviewController', () => {
  const originalBackendUrl = config.get('eprBackendUrl')
  const backendUrl = 'http://mock-backend'
  const organisationId = '69c3b4f0abda9efa68dd6697'
  const registrationId = '69c3b4f0abda9efa68dd669b'
  const url = `/organisations/${organisationId}/registrations/${registrationId}/overview`
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

  const accreditationId = '69c3b4f0abda9efa68dd6698'

  /**
   * @type {{
   *   id: string,
   *   registrationNumber: string | undefined,
   *   status: string,
   *   processingType: string,
   *   material: string,
   *   site: string,
   *   accreditation: { id: string, accreditationNumber: string, status: string } | null
   * }}
   */
  const mockRegistration = {
    id: registrationId,
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

  const mockWasteBalance = {
    amount: 1500,
    availableAmount: 1200
  }

  const mockOverview = {
    id: organisationId,
    companyName: 'ACME ltd',
    registrations: [mockRegistration]
  }

  const mockCalendar = {
    cadence: 'monthly',
    reportingPeriods: [
      {
        year: 2026,
        period: 1,
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        dueDate: '2026-02-20',
        report: {
          id: 'b41148de-8a76-4214-b68d-4b786400fb90',
          status: 'ready_to_submit',
          submissionNumber: 1
        }
      },
      {
        year: 2026,
        period: 2,
        startDate: '2026-02-01',
        endDate: '2026-02-28',
        dueDate: '2026-03-20',
        report: null
      }
    ]
  }

  const mockCalendarWithSubmittedReport = {
    cadence: 'monthly',
    reportingPeriods: [
      {
        year: 2026,
        period: 1,
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        dueDate: '2026-02-20',
        report: {
          id: 'b41148de-8a76-4214-b68d-4b786400fb90',
          status: 'submitted',
          submissionNumber: 1
        }
      }
    ]
  }

  const mockSubmittedSummaryLog = {
    summaryLogId: 'sl-submitted',
    filename: 'jan.xlsx',
    uploadedAt: '2026-01-01T11:00:00.000Z',
    status: 'submitted'
  }

  const mockValidationFailedSummaryLog = {
    summaryLogId: 'sl-validation-failed',
    filename: 'feb.xlsx',
    uploadedAt: '2026-01-04T11:00:00.000Z',
    status: 'validation_failed'
  }

  const renderPage = (html) => {
    const window = new Window()
    window.document.body.innerHTML = html
    return /** @type {HTMLElement} */ (
      /** @type {unknown} */ (window.document.body)
    )
  }

  const getReportsTable = (container) =>
    getByRole(container, 'table', { name: 'Reports' })

  const getSummaryLogsTable = (container) =>
    getByRole(container, 'table', { name: 'Summary logs' })

  const getDataRows = (table) => getAllByRole(table, 'row').slice(1)

  const getSummaryRowValue = (container, label) => {
    const term = getByText(container, label, { selector: 'dt' })
    const row = /** @type {HTMLElement} */ (
      term.closest('.govuk-summary-list__row')
    )
    return within(row).getByRole('definition')
  }

  const useMockBackend = (
    overviewResponse = mockOverview,
    calendarResponse = mockCalendar,
    summaryLogsResponse = {
      summaryLogs: /** @type {Array<typeof mockSubmittedSummaryLog>} */ ([])
    },
    wasteBalanceResponse = /** @type {Record<string, typeof mockWasteBalance>} */ ({
      [accreditationId]: mockWasteBalance
    })
  ) => {
    mswServer.use(
      http.get(
        `${backendUrl}/v1/organisations/${organisationId}/overview`,
        () => HttpResponse.json(overviewResponse)
      ),
      http.get(
        `${backendUrl}/v1/organisations/${organisationId}/registrations/${registrationId}/reports/calendar`,
        () => HttpResponse.json(calendarResponse)
      ),
      http.get(
        `${backendUrl}/v1/organisations/${organisationId}/registrations/${registrationId}/summary-logs`,
        () => HttpResponse.json(summaryLogsResponse)
      ),
      http.get(
        `${backendUrl}/v1/organisations/${organisationId}/waste-balances`,
        () => HttpResponse.json(wasteBalanceResponse)
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

    test('Should render the company name and registration number as heading', async () => {
      useMockBackend()

      const { result } = await server.inject({
        method: 'GET',
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      const body = renderPage(result)

      expect(getByRole(body, 'heading', { level: 1 })).toHaveTextContent(
        'ACME ltd - REG-50030-001'
      )
    })

    test('Should fall back to registration id in heading when registrationNumber is missing', async () => {
      useMockBackend({
        ...mockOverview,
        registrations: [{ ...mockRegistration, registrationNumber: undefined }]
      })

      const { result } = await server.inject({
        method: 'GET',
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      const body = renderPage(result)

      expect(getByRole(body, 'heading', { level: 1 })).toHaveTextContent(
        `ACME ltd - ${registrationId}`
      )
    })

    test('Should render breadcrumbs for Organisations and Overview', async () => {
      useMockBackend()

      const { result } = await server.inject({
        method: 'GET',
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      const body = renderPage(result)
      const breadcrumbs = getByRole(body, 'navigation', { name: 'Breadcrumb' })

      expect(
        getAllByRole(breadcrumbs, 'link').map((l) => l.textContent?.trim())
      ).toEqual(['Organisations', 'Organisation overview'])
      expect(
        getByRole(breadcrumbs, 'link', { name: 'Organisations' })
      ).toHaveAttribute('href', '/organisations')
      expect(
        getByRole(breadcrumbs, 'link', { name: 'Organisation overview' })
      ).toHaveAttribute('href', `/organisations/${organisationId}/overview`)
    })

    test('Should render summary list with status, processing type, material and site', async () => {
      useMockBackend()

      const { result } = await server.inject({
        method: 'GET',
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      const body = renderPage(result)

      expect(
        within(getSummaryRowValue(body, 'Status')).getByText('approved')
      ).toHaveClass('govuk-tag')
      expect(getSummaryRowValue(body, 'Processing type')).toHaveTextContent(
        'reprocessing'
      )
      expect(getSummaryRowValue(body, 'Material')).toHaveTextContent('glass')
      expect(getSummaryRowValue(body, 'Site')).toHaveTextContent('Site A')
    })

    test('Should render accreditation rows in summary list when accreditation exists', async () => {
      useMockBackend()

      const { result } = await server.inject({
        method: 'GET',
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      const body = renderPage(result)

      expect(
        getSummaryRowValue(body, 'Accreditation number')
      ).toHaveTextContent('ACC-50030-001')
      expect(
        within(getSummaryRowValue(body, 'Accreditation status')).getByText(
          'approved'
        )
      ).toHaveClass('govuk-tag')
    })

    test('Should not render accreditation rows in summary list when accreditation is absent', async () => {
      useMockBackend({
        ...mockOverview,
        registrations: [{ ...mockRegistration, accreditation: null }]
      })

      const { result } = await server.inject({
        method: 'GET',
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      const body = renderPage(result)

      expect(
        queryByText(body, 'Accreditation number', { selector: 'dt' })
      ).toBeNull()
      expect(
        queryByText(body, 'Accreditation status', { selector: 'dt' })
      ).toBeNull()
    })

    test('Should render the reporting periods table', async () => {
      useMockBackend()

      const { result } = await server.inject({
        method: 'GET',
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      const body = renderPage(result)
      const reportsTable = getReportsTable(body)

      expect(
        getAllByRole(reportsTable, 'columnheader').map((h) =>
          h.textContent?.trim()
        )
      ).toEqual(['Period', 'Due', 'Status', 'Actions'])

      const [firstRow, secondRow] = getDataRows(reportsTable)

      expect(within(firstRow).getByText('January')).toBeInTheDocument()
      expect(within(firstRow).getByText('2026-02-20')).toBeInTheDocument()
      expect(within(firstRow).getByText('ready_to_submit')).toHaveClass(
        'govuk-tag'
      )
      expect(
        within(firstRow).getByRole('link', { name: 'View' })
      ).toHaveAttribute(
        'href',
        `/organisations/${organisationId}/registrations/${registrationId}/reports/2026/monthly/1`
      )

      expect(within(secondRow).getByText('Due')).toHaveClass('govuk-tag')
      expect(within(secondRow).queryByRole('link')).toBeNull()
    })

    test('Should render the Summary logs table with column headers when summary logs exist', async () => {
      useMockBackend(mockOverview, mockCalendar, {
        summaryLogs: [mockSubmittedSummaryLog]
      })

      const { result } = await server.inject({
        method: 'GET',
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      const body = renderPage(result)

      expect(
        getAllByRole(getSummaryLogsTable(body), 'columnheader').map((h) =>
          h.textContent?.trim()
        )
      ).toEqual(['Uploaded at', 'Status', 'Actions'])
    })

    test('Should render a green Success tag and Download link for a submitted log', async () => {
      useMockBackend(mockOverview, mockCalendar, {
        summaryLogs: [mockSubmittedSummaryLog]
      })

      const { result } = await server.inject({
        method: 'GET',
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      const body = renderPage(result)
      const [firstRow] = getDataRows(getSummaryLogsTable(body))

      expect(
        within(firstRow).getByText('2026-01-01T11:00:00.000Z')
      ).toBeInTheDocument()
      expect(within(firstRow).getByText('Success')).toHaveClass(
        'govuk-tag',
        'govuk-tag--green'
      )
      expect(
        within(firstRow).getByRole('link', { name: 'Download' })
      ).toHaveAttribute(
        'href',
        `/system-logs/download/${organisationId}/${registrationId}/${mockSubmittedSummaryLog.summaryLogId}`
      )
    })

    test.each([
      ['rejected', 'Failed (Rejected)'],
      ['invalid', 'Failed (Invalid)'],
      ['validation_failed', 'Failed (Validation)'],
      ['submission_failed', 'Failed (Submission)']
    ])(
      'Should render a red "%s" tag labelled "%s"',
      async (status, expectedLabel) => {
        useMockBackend(mockOverview, mockCalendar, {
          summaryLogs: [{ ...mockValidationFailedSummaryLog, status }]
        })

        const { result } = await server.inject({
          method: 'GET',
          url,
          auth: { strategy: 'session', credentials: mockUserSession }
        })

        const body = renderPage(result)
        const firstRow = getDataRows(getSummaryLogsTable(body))[0]
        const tag = within(firstRow).getByText(expectedLabel)

        expect(tag).toHaveClass('govuk-tag', 'govuk-tag--red')
      }
    )

    test('Should render multiple summary-log rows newest-first', async () => {
      useMockBackend(mockOverview, mockCalendar, {
        summaryLogs: [mockSubmittedSummaryLog, mockValidationFailedSummaryLog]
      })

      const { result } = await server.inject({
        method: 'GET',
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      const body = renderPage(result)
      const dataRows = getDataRows(getSummaryLogsTable(body))

      expect(dataRows).toHaveLength(2)
      expect(
        within(dataRows[0]).getByText('2026-01-01T11:00:00.000Z')
      ).toBeInTheDocument()
      expect(
        within(dataRows[1]).getByText('2026-01-04T11:00:00.000Z')
      ).toBeInTheDocument()
    })

    test('Should render "No summary logs" when the summary-logs list is empty', async () => {
      useMockBackend()

      const { result } = await server.inject({
        method: 'GET',
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      const body = renderPage(result)

      expect(queryByRole(body, 'table', { name: 'Summary logs' })).toBeNull()
      expect(getByText(body, 'No summary logs')).toBeInTheDocument()
    })

    test('Should show 500 error page when the summary-logs backend returns a non-OK response', async () => {
      mswServer.use(
        http.get(
          `${backendUrl}/v1/organisations/${organisationId}/overview`,
          () => HttpResponse.json(mockOverview)
        ),
        http.get(
          `${backendUrl}/v1/organisations/${organisationId}/registrations/${registrationId}/reports/calendar`,
          () => HttpResponse.json(mockCalendar)
        ),
        http.get(
          `${backendUrl}/v1/organisations/${organisationId}/registrations/${registrationId}/summary-logs`,
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

    test('Should return 404 when registration is not found', async () => {
      useMockBackend({ ...mockOverview, registrations: [] })

      const { statusCode } = await server.inject({
        method: 'GET',
        url,
        auth: { strategy: 'session', credentials: mockUserSession }
      })

      expect(statusCode).toBe(statusCodes.notFound)
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

    describe('Waste balance section', () => {
      test('Should render waste balance rows in summary list when accredited', async () => {
        useMockBackend()

        const { result } = await server.inject({
          method: 'GET',
          url,
          auth: { strategy: 'session', credentials: mockUserSession }
        })

        const body = renderPage(result)

        expect(
          getSummaryRowValue(body, 'Waste balance (tonnes)')
        ).toHaveTextContent('1500')
        expect(
          getSummaryRowValue(body, 'Waste balance available (tonnes)')
        ).toHaveTextContent('1200')
      })

      test('Should not render waste balance rows when the registration has no accreditation', async () => {
        useMockBackend({
          ...mockOverview,
          registrations: [{ ...mockRegistration, accreditation: null }]
        })

        const { result } = await server.inject({
          method: 'GET',
          url,
          auth: { strategy: 'session', credentials: mockUserSession }
        })

        const body = renderPage(result)

        expect(
          queryByText(body, 'Waste balance (tonnes)', { selector: 'dt' })
        ).toBeNull()
        expect(
          queryByText(body, 'Waste balance available (tonnes)', {
            selector: 'dt'
          })
        ).toBeNull()
      })

      test('Should render "No data" in waste balance rows when the backend returns no balance', async () => {
        useMockBackend(mockOverview, mockCalendar, { summaryLogs: [] }, {})

        const { result } = await server.inject({
          method: 'GET',
          url,
          auth: { strategy: 'session', credentials: mockUserSession }
        })

        const body = renderPage(result)

        expect(
          getSummaryRowValue(body, 'Waste balance (tonnes)')
        ).toHaveTextContent('No data')
        expect(
          getSummaryRowValue(body, 'Waste balance available (tonnes)')
        ).toHaveTextContent('No data')
      })

      test('Should still render the page with "No data" in waste balance rows when the waste balance endpoint errors', async () => {
        mswServer.use(
          http.get(
            `${backendUrl}/v1/organisations/${organisationId}/overview`,
            () => HttpResponse.json(mockOverview)
          ),
          http.get(
            `${backendUrl}/v1/organisations/${organisationId}/registrations/${registrationId}/reports/calendar`,
            () => HttpResponse.json(mockCalendar)
          ),
          http.get(
            `${backendUrl}/v1/organisations/${organisationId}/registrations/${registrationId}/summary-logs`,
            () => HttpResponse.json({ summaryLogs: [] })
          ),
          http.get(
            `${backendUrl}/v1/organisations/${organisationId}/waste-balances`,
            () => {
              throw HttpResponse.text('', { status: 500 })
            }
          )
        )

        const { statusCode, result } = await server.inject({
          method: 'GET',
          url,
          auth: { strategy: 'session', credentials: mockUserSession }
        })

        expect(statusCode).toBe(statusCodes.ok)

        const body = renderPage(result)

        expect(
          getSummaryRowValue(body, 'Waste balance (tonnes)')
        ).toHaveTextContent('No data')
        expect(
          getSummaryRowValue(body, 'Waste balance available (tonnes)')
        ).toHaveTextContent('No data')
      })
    })

    describe('Unsubmit link visibility', () => {
      afterEach(() => {
        vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
      })

      test('Should render the Unsubmit link for a submitted report when the user has admin.write scope', async () => {
        useMockBackend(mockOverview, mockCalendarWithSubmittedReport)

        const { result } = await server.inject({
          method: 'GET',
          url,
          auth: { strategy: 'session', credentials: mockUserSession }
        })

        const body = renderPage(result)
        const unsubmitLink = within(getReportsTable(body)).getByRole('link', {
          name: 'Unsubmit'
        })

        expect(unsubmitLink).toHaveAttribute(
          'href',
          `/organisations/${organisationId}/registrations/${registrationId}/reports/2026/monthly/1/unsubmit/confirm`
        )
      })

      test('Should not render the Unsubmit link when the user lacks admin.write scope', async () => {
        const readOnlySession = {
          ...mockUserSession,
          scopes: ['admin.read']
        }
        vi.mocked(getUserSession).mockResolvedValue(readOnlySession)
        useMockBackend(mockOverview, mockCalendarWithSubmittedReport)

        const { result } = await server.inject({
          method: 'GET',
          url,
          auth: { strategy: 'session', credentials: readOnlySession }
        })

        const body = renderPage(result)

        expect(
          within(getReportsTable(body)).queryByRole('link', {
            name: 'Unsubmit'
          })
        ).toBeNull()
      })
    })
  })
})
