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

describe('registration-status-transition', () => {
  const backendUrl = config.get('eprBackendUrl')
  const organisationId = 'aaa111bbb222ccc333ddd4444'
  const registrationId = 'eee555fff666ggg777hhh8888'
  const overviewUrl = `/organisations/${organisationId}/registrations/${registrationId}/overview`
  const confirmUrl = `/organisations/${organisationId}/registrations/${registrationId}/approve/confirm`
  const postUrl = `/organisations/${organisationId}/registrations/${registrationId}/approve`
  const backendStatusHistoryUrl = `${backendUrl}/v1/organisations/${organisationId}/registrations/${registrationId}/status-history`

  const readOnlySession = { ...mockUserSession, scopes: ['admin.read'] }

  const writeAuth = { strategy: 'session', credentials: mockUserSession }
  const readAuth = { strategy: 'session', credentials: readOnlySession }

  const heading = 'Approve registration'
  const warningText =
    'This action must only be taken following the required legal process for approval and following instruction from an industry regulator. Approving a registration registers the operator for this site and material — they must submit the registered-only summary log and report quarterly. It does not permit PRN/PERN issuing (an accreditation is required for that).'
  const buttonText = 'Approve now'
  const fallbackError =
    'There was a problem approving the registration. Please try again.'

  const validFormPayload = {
    'appliesFrom-day': '1',
    'appliesFrom-month': '8',
    'appliesFrom-year': '2026',
    registrationNumber: 'REG999999'
  }

  const expectedBody = {
    fromStatus: 'created',
    toStatus: 'approved',
    appliesFrom: '2026-08-01',
    registrationNumber: 'REG999999'
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

  const stubOverview = (status = 'approved') =>
    mswServer.use(
      http.get(
        `${backendUrl}/v1/organisations/${organisationId}/overview`,
        () =>
          HttpResponse.json({
            id: organisationId,
            companyName: 'ACME Ltd',
            registrations: [
              {
                id: registrationId,
                status,
                processingType: 'reprocessor',
                material: 'plastic',
                site: 'Site 1',
                accreditation: null
              }
            ]
          })
      )
    )

  const stubCalendarAndSummaryLogs = () => {
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
  }

  const stubTransitionSuccess = (targetStatus, receivedBodies = []) =>
    mswServer.use(
      http.post(backendStatusHistoryUrl, async ({ request }) => {
        receivedBodies.push(await request.json())
        return HttpResponse.json({ status: targetStatus })
      })
    )

  const stubTransitionFailure = (status = 422) =>
    mswServer.use(
      http.post(backendStatusHistoryUrl, () =>
        HttpResponse.json(
          { message: 'Registration number REG999999 is already in use' },
          { status }
        )
      )
    )

  const stubTransitionFailureWithoutMessage = (status = 400) =>
    mswServer.use(
      http.post(backendStatusHistoryUrl, () =>
        HttpResponse.json({ error: 'Bad request' }, { status })
      )
    )

  const postApprove = async (payloadOverrides) => {
    const { cookie, crumb } = await getCsrfToken(server, confirmUrl, writeAuth)
    return server.inject({
      method: 'POST',
      url: postUrl,
      auth: writeAuth,
      headers: { cookie },
      payload: { crumb, ...validFormPayload, ...payloadOverrides }
    })
  }

  const expectOverviewFlash = async (redirectCookie, message) => {
    stubOverview()
    stubCalendarAndSummaryLogs()
    const { result } = await server.inject({
      method: 'GET',
      url: overviewUrl,
      headers: { cookie: redirectCookie },
      auth: writeAuth
    })
    const $ = cheerio.load(result)
    expect($('.govuk-error-summary').text()).toContain(message)
  }

  test('confirm page is rejected with 401 when unauthenticated', async () => {
    const { statusCode } = await server.inject({
      method: 'GET',
      url: confirmUrl
    })
    expect(statusCode).toBe(statusCodes.unauthorised)
  })

  test('confirm page returns 403 for a read-only admin', async () => {
    vi.mocked(getUserSession).mockResolvedValue(readOnlySession)
    const { statusCode } = await server.inject({
      method: 'GET',
      url: confirmUrl,
      auth: readAuth
    })
    expect(statusCode).toBe(statusCodes.forbidden)
  })

  test('confirm page renders the warning copy verbatim, both grant fields, Approve now and Cancel', async () => {
    vi.mocked(getUserSession).mockResolvedValue(mockUserSession)

    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: confirmUrl,
      auth: writeAuth
    })

    expect(statusCode).toBe(statusCodes.ok)
    const $ = cheerio.load(result)
    expect($('h1').text().trim()).toBe(heading)
    expect(result).toContain(warningText)
    expect($('input[name="appliesFrom-day"]')).toHaveLength(1)
    expect($('input[name="appliesFrom-month"]')).toHaveLength(1)
    expect($('input[name="appliesFrom-year"]')).toHaveLength(1)
    expect($('input[name="registrationNumber"]')).toHaveLength(1)
    expect($('form').attr('action')).toBe(postUrl)
    expect($(`button:contains("${buttonText}")`)).toHaveLength(1)
    expect($('a:contains("Cancel")').attr('href')).toBe(overviewUrl)
  })

  test('POST is rejected with 401 when unauthenticated', async () => {
    const { statusCode } = await server.inject({
      method: 'POST',
      url: postUrl
    })
    expect(statusCode).toBe(statusCodes.unauthorised)
  })

  test('POST is rejected with 403 for a read-only admin', async () => {
    vi.mocked(getUserSession).mockResolvedValue(readOnlySession)
    const { cookie, crumb } = await getCsrfToken(server, confirmUrl, readAuth)
    const { statusCode } = await server.inject({
      method: 'POST',
      url: postUrl,
      auth: readAuth,
      headers: { cookie },
      payload: { crumb }
    })
    expect(statusCode).toBe(statusCodes.forbidden)
  })

  test('successful approve posts the from/to transition and grant fields to the backend status-history endpoint and redirects to the overview', async () => {
    vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
    const receivedBodies = []
    stubTransitionSuccess('approved', receivedBodies)

    const postResponse = await postApprove()
    expect(postResponse.statusCode).toBe(statusCodes.found)
    expect(postResponse.headers.location).toBe(overviewUrl)
    expect(receivedBodies).toEqual([expectedBody])
  })

  test('failed approve when the backend is unreachable falls back to the generic flash error', async () => {
    vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
    mswServer.use(
      http.post(backendStatusHistoryUrl, () => HttpResponse.error())
    )

    const postResponse = await postApprove()
    expect(postResponse.statusCode).toBe(statusCodes.found)
    expect(postResponse.headers.location).toBe(overviewUrl)

    const postCookies = [postResponse.headers['set-cookie']]
      .flat()
      .filter(Boolean)
    const redirectCookie = postCookies.map((c) => c.split(';')[0]).join('; ')

    await expectOverviewFlash(redirectCookie, fallbackError)
  })

  test('missing registration number re-renders the page with an error, preserving the date', async () => {
    vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
    const receivedBodies = []
    stubTransitionSuccess('approved', receivedBodies)

    const response = await postApprove({ registrationNumber: '  ' })

    expect(response.statusCode).toBe(statusCodes.badRequest)
    const $ = cheerio.load(response.result)
    expect($('.govuk-error-summary').text()).toContain(
      'Enter a registration number'
    )
    expect($('input[name="appliesFrom-day"]').attr('value')).toBe('1')
    expect($('input[name="appliesFrom-year"]').attr('value')).toBe('2026')
    expect(receivedBodies).toEqual([])
  })

  test.each([
    ['a missing day', { 'appliesFrom-day': '' }],
    ['a non-numeric month', { 'appliesFrom-month': 'August' }],
    ['a month past December', { 'appliesFrom-month': '13' }],
    ['a two-digit year', { 'appliesFrom-year': '26' }],
    [
      'an impossible date',
      { 'appliesFrom-month': '2', 'appliesFrom-day': '30' }
    ]
  ])(
    'an invalid applies from date (%s) re-renders the page with an error, preserving the number',
    async (_label, payloadOverrides) => {
      vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
      const receivedBodies = []
      stubTransitionSuccess('approved', receivedBodies)

      const response = await postApprove(payloadOverrides)

      expect(response.statusCode).toBe(statusCodes.badRequest)
      const $ = cheerio.load(response.result)
      expect($('.govuk-error-summary').text()).toContain(
        'Enter a valid applies from date'
      )
      expect($('input[name="registrationNumber"]').attr('value')).toBe(
        'REG999999'
      )
      expect(receivedBodies).toEqual([])
    }
  )

  test('missing both fields lists both errors in the summary', async () => {
    vi.mocked(getUserSession).mockResolvedValue(mockUserSession)

    const response = await postApprove({
      'appliesFrom-day': '',
      'appliesFrom-month': '',
      'appliesFrom-year': '',
      registrationNumber: ''
    })

    expect(response.statusCode).toBe(statusCodes.badRequest)
    const $ = cheerio.load(response.result)
    const summary = $('.govuk-error-summary').text()
    expect(summary).toContain('Enter a valid applies from date')
    expect(summary).toContain('Enter a registration number')
  })

  test('a submission without any grant fields lists both errors in the summary', async () => {
    vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
    const { cookie, crumb } = await getCsrfToken(server, confirmUrl, writeAuth)

    const response = await server.inject({
      method: 'POST',
      url: postUrl,
      auth: writeAuth,
      headers: { cookie },
      payload: { crumb }
    })

    expect(response.statusCode).toBe(statusCodes.badRequest)
    const $ = cheerio.load(response.result)
    const summary = $('.govuk-error-summary').text()
    expect(summary).toContain('Enter a valid applies from date')
    expect(summary).toContain('Enter a registration number')
  })

  test('a backend rejection re-renders the page with the backend message, preserving input', async () => {
    vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
    stubTransitionFailure()

    const response = await postApprove()

    expect(response.statusCode).toBe(statusCodes.badRequest)
    const $ = cheerio.load(response.result)
    expect($('.govuk-error-summary').text()).toContain(
      'Registration number REG999999 is already in use'
    )
    expect($('input[name="appliesFrom-day"]').attr('value')).toBe('1')
    expect($('input[name="appliesFrom-month"]').attr('value')).toBe('8')
    expect($('input[name="appliesFrom-year"]').attr('value')).toBe('2026')
    expect($('input[name="registrationNumber"]').attr('value')).toBe(
      'REG999999'
    )
  })

  test('a backend rejection without a message re-renders the page with the generic error', async () => {
    vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
    stubTransitionFailureWithoutMessage()

    const response = await postApprove()

    expect(response.statusCode).toBe(statusCodes.badRequest)
    const $ = cheerio.load(response.result)
    expect($('.govuk-error-summary').text()).toContain(fallbackError)
  })

  test('a non-object backend error body falls back to the generic flash error', async () => {
    vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
    mswServer.use(
      http.post(backendStatusHistoryUrl, () =>
        HttpResponse.json(null, { status: 422 })
      )
    )

    const response = await postApprove()

    expect(response.statusCode).toBe(statusCodes.badRequest)
    const $ = cheerio.load(response.result)
    expect($('.govuk-error-summary').text()).toContain(fallbackError)
  })

  test('a backend 5xx failure redirects to the overview with the generic flash error', async () => {
    vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
    stubTransitionFailure(statusCodes.internalServerError)

    const postResponse = await postApprove()
    expect(postResponse.statusCode).toBe(statusCodes.found)
    expect(postResponse.headers.location).toBe(overviewUrl)

    const postCookies = [postResponse.headers['set-cookie']]
      .flat()
      .filter(Boolean)
    const redirectCookie = postCookies.map((c) => c.split(';')[0]).join('; ')

    await expectOverviewFlash(redirectCookie, fallbackError)
  })
})
