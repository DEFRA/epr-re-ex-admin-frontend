import { vi } from 'vitest'
import * as cheerio from 'cheerio'
import { config } from '#config/config.js'
import { statusCodes } from '#server/common/constants/status-codes.js'
import { mockUserSession } from '#server/common/test-helpers/fixtures.js'
import { getUserSession } from '#server/common/helpers/auth/get-user-session.js'
import { createMockOidcServer } from '#server/common/test-helpers/mock-oidc.js'
import { getCsrfToken } from '#server/common/test-helpers/csrf-helper.js'
import { http, server as mswServer, HttpResponse } from '#vite/setup-msw.js'
import { createServer } from '#server/server.js'

vi.mock('#server/common/helpers/auth/get-user-session.js', () => ({
  getUserSession: vi.fn().mockReturnValue(null)
}))

describe('report-unsubmit', () => {
  const backendUrl = config.get('eprBackendUrl')
  const organisationId = 'aaa111bbb222ccc333ddd4444'
  const registrationId = 'bbb222ccc333ddd444eee5555'
  const year = '2026'
  const cadence = 'monthly'
  const period = '1'
  const submissionNumber = '1'

  const BASE_URL = `/organisations/${organisationId}/registrations/${registrationId}/reports/${year}/${cadence}/${period}/submissions/${submissionNumber}`
  const confirmUrl = `${BASE_URL}/unsubmit/confirm`
  const postUrl = `${BASE_URL}/unsubmit`
  const resultUrl = `${BASE_URL}/unsubmit/result`
  const overviewUrl = `/organisations/${organisationId}/registrations/${registrationId}/overview`

  const mockOverview = {
    id: organisationId,
    companyName: 'ACME Ltd',
    registrations: [
      {
        id: registrationId,
        registrationNumber: 'E25SR500020912PA',
        status: 'approved',
        processingType: 'exporter',
        material: 'paper',
        site: null,
        accreditation: null
      }
    ]
  }

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

  const stubOverview = () =>
    mswServer.use(
      http.get(
        `${backendUrl}/v1/organisations/${organisationId}/overview`,
        () => HttpResponse.json(mockOverview)
      )
    )

  /**
   * @param {{
   *   currentStatus?: string,
   *   resubmissionRequired?: Record<string, unknown>,
   *   unsubmittedAt?: string
   * }} [report]
   */
  const stubReport = ({
    currentStatus = 'ready_to_submit',
    unsubmittedAt = '2026-05-06T10:00:00.000Z',
    resubmissionRequired = undefined
  } = {}) =>
    mswServer.use(
      http.get(
        `${backendUrl}/v1/organisations/${organisationId}/registrations/${registrationId}/reports/${year}/${cadence}/${period}/submissions/${submissionNumber}`,
        () =>
          HttpResponse.json({
            status: {
              currentStatus,
              ...(unsubmittedAt ? { unsubmitted: { at: unsubmittedAt } } : {})
            },
            ...(resubmissionRequired ? { resubmissionRequired } : {})
          })
      )
    )

  const stubUnsubmitSuccess = () =>
    mswServer.use(
      http.post(
        `${backendUrl}/v1/organisations/${organisationId}/registrations/${registrationId}/reports/${year}/${cadence}/${period}/submissions/${submissionNumber}/unsubmit`,
        () => HttpResponse.json({ status: 'ready_to_submit' })
      )
    )

  const stubUnsubmitFailure = (status = 409) =>
    mswServer.use(
      http.post(
        `${backendUrl}/v1/organisations/${organisationId}/registrations/${registrationId}/reports/${year}/${cadence}/${period}/submissions/${submissionNumber}/unsubmit`,
        () => HttpResponse.json({ error: 'Conflict' }, { status })
      )
    )

  const authOptions = { strategy: 'session', credentials: mockUserSession }

  const getConfirm = async () => {
    const response = await server.inject({
      method: 'GET',
      url: confirmUrl,
      auth: authOptions
    })
    const cookies = [response.headers['set-cookie']].flat().filter(Boolean)

    return {
      response,
      redirectCookie: cookies.map((c) => c.split(';')[0]).join('; ')
    }
  }

  const expectOverviewFlash = async (redirectCookie, message) => {
    mswServer.use(
      http.get(
        `${backendUrl}/v1/organisations/${organisationId}/registrations/${registrationId}/reports/calendar`,
        () => HttpResponse.json({ cadence: 'monthly', reportingPeriods: [] })
      ),
      http.get(
        `${backendUrl}/v1/organisations/${organisationId}/registrations/${registrationId}/summary-logs`,
        () => HttpResponse.json({ summaryLogs: [] })
      )
    )

    const { result } = await server.inject({
      method: 'GET',
      url: overviewUrl,
      headers: { cookie: redirectCookie },
      auth: authOptions
    })

    expect(cheerio.load(result)('.govuk-error-summary').text()).toContain(
      message
    )
  }

  const postUnsubmit = async () => {
    const { cookie, crumb } = await getCsrfToken(
      server,
      confirmUrl,
      authOptions
    )
    return server.inject({
      method: 'POST',
      url: postUrl,
      auth: authOptions,
      headers: { cookie },
      payload: { crumb }
    })
  }

  test('unauthenticated requests are rejected', async () => {
    const { statusCode } = await server.inject({
      method: 'GET',
      url: confirmUrl
    })
    expect(statusCode).toBe(statusCodes.unauthorised)
  })

  test('confirm page shows report details and unsubmit action', async () => {
    vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
    stubOverview()
    stubReport({ currentStatus: 'submitted', unsubmittedAt: undefined })

    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: confirmUrl,
      auth: authOptions
    })

    expect(statusCode).toBe(statusCodes.ok)
    const $ = cheerio.load(result)
    expect($('h1').text().trim()).toBe('Unsubmit report')
    expect(result).toContain('E25SR500020912PA')
    expect(result).toContain('January')
    expect($('body').text()).toMatch(/Submission:\s*1/)
    expect($('form').attr('action')).toBe(postUrl)
    expect($('a:contains("Cancel")').attr('href')).toBe(overviewUrl)
  })

  test('confirm page returns 404 when the registration is missing from the overview', async () => {
    vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
    mswServer.use(
      http.get(
        `${backendUrl}/v1/organisations/${organisationId}/overview`,
        () => HttpResponse.json({ ...mockOverview, registrations: [] })
      )
    )
    stubReport({ currentStatus: 'submitted', unsubmittedAt: undefined })

    const { statusCode } = await server.inject({
      method: 'GET',
      url: confirmUrl,
      auth: authOptions
    })

    expect(statusCode).toBe(statusCodes.notFound)
  })

  test('confirm page redirects to overview for a non-submitted report', async () => {
    vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
    stubOverview()
    stubReport({ currentStatus: 'ready_to_submit', unsubmittedAt: undefined })

    const { response, redirectCookie } = await getConfirm()

    expect(response.statusCode).toBe(statusCodes.found)
    expect(response.headers.location).toBe(overviewUrl)
    await expectOverviewFlash(
      redirectCookie,
      'This report cannot be unsubmitted because it is no longer submitted.'
    )
  })

  it.each([
    {
      flaggedBy: 'the operator',
      resubmissionRequired: {
        operatorRequested: { at: '2026-05-01T10:00:00.000Z' }
      }
    },
    {
      flaggedBy: 'a closed period restatement',
      resubmissionRequired: {
        closedPeriodRestated: { summaryLogId: 'sl-restated' }
      }
    }
  ])(
    'should redirect to overview for a report flagged for resubmission by $flaggedBy',
    async ({ resubmissionRequired }) => {
      vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
      stubOverview()
      stubReport({
        currentStatus: 'submitted',
        unsubmittedAt: undefined,
        resubmissionRequired
      })

      const { response, redirectCookie } = await getConfirm()

      expect(response.statusCode).toBe(statusCodes.found)
      expect(response.headers.location).toBe(overviewUrl)
      await expectOverviewFlash(
        redirectCookie,
        'This report cannot be unsubmitted because a resubmission has been requested for this period.'
      )
    }
  )

  test('submitting the confirmation redirects to the success page', async () => {
    vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
    stubOverview()
    stubReport({ currentStatus: 'submitted', unsubmittedAt: undefined })
    stubUnsubmitSuccess()

    const { statusCode, headers } = await postUnsubmit()

    expect(statusCode).toBe(statusCodes.found)
    expect(headers.location).toBe(resultUrl)
  })

  test('backend failure shows the unsubmit failed page', async () => {
    vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
    stubOverview()
    stubReport({ currentStatus: 'submitted', unsubmittedAt: undefined })
    stubUnsubmitFailure()

    const { result, statusCode } = await postUnsubmit()

    expect(statusCode).toBe(statusCodes.ok)
    const $ = cheerio.load(result)
    expect($('.govuk-panel__title').text().trim()).toBe('Unsubmit failed')
    expect($('body').text()).toMatch(/Submission:\s*1/)
  })

  it('should say why the unsubmit was refused when the backend rejects it', async () => {
    vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
    stubOverview()
    stubReport({ currentStatus: 'submitted', unsubmittedAt: undefined })
    stubUnsubmitFailure(statusCodes.conflict)

    const { result } = await postUnsubmit()

    expect(cheerio.load(result)('body').text()).toContain(
      'The report could not be unsubmitted because its status has changed. It may have been superseded by a later submission, or flagged for resubmission.'
    )
  })

  it('should not offer a reason when the backend fails for any other cause', async () => {
    vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
    stubOverview()
    stubReport({ currentStatus: 'submitted', unsubmittedAt: undefined })
    stubUnsubmitFailure(statusCodes.internalServerError)

    const bodyText = cheerio
      .load((await postUnsubmit()).result)('body')
      .text()

    expect(bodyText).toContain('The report could not be unsubmitted.')
    expect(bodyText).not.toContain('its status has changed')
  })

  test('success page confirms the report was unsubmitted', async () => {
    vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
    stubOverview()
    stubReport()

    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: resultUrl,
      auth: authOptions
    })

    expect(statusCode).toBe(statusCodes.ok)
    const $ = cheerio.load(result)
    expect($('.govuk-panel__title').text().trim()).toBe('Report unsubmitted')
    expect(result).toContain('E25SR500020912PA')
    expect($('body').text()).toMatch(/Submission:\s*1/)
    expect($('a:contains("Back to registration overview")').attr('href')).toBe(
      overviewUrl
    )
  })

  test('result page redirects to overview when accessed without completing unsubmit', async () => {
    vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
    stubOverview()
    stubReport({ currentStatus: 'submitted', unsubmittedAt: undefined })

    const { statusCode, headers } = await server.inject({
      method: 'GET',
      url: resultUrl,
      auth: authOptions
    })

    expect(statusCode).toBe(statusCodes.found)
    expect(headers.location).toBe(overviewUrl)
  })
})
