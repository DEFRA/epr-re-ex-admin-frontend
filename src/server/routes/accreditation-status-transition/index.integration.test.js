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

const TRANSITION_CASES = [
  {
    action: 'approve',
    heading: 'Approve accreditation',
    warningText:
      'This action must only be taken following the required legal process for approval and following instruction from an industry regulator. Approving an operator will grant them permission to issue PRNs and declared tonnages will count towards their waste balance',
    buttonText: 'Approve now',
    fallbackError:
      'There was a problem approving the accreditation. Please try again.',
    formPayload: {
      'appliesFrom-day': '1',
      'appliesFrom-month': '8',
      'appliesFrom-year': '2026',
      accreditationNumber: 'ACC999999'
    },
    expectedBody: {
      fromStatus: 'created',
      toStatus: 'approved',
      appliesFrom: '2026-08-01',
      accreditationNumber: 'ACC999999'
    },
    hasGrantFields: true
  },
  {
    action: 'suspend',
    heading: 'Suspend accreditation',
    warningText:
      'This action must only be taken following the required legal process for suspension and following instruction from an industry regulator. Suspending an operator will remove their ability to issue PRNs and all declared tonnages submitted during the suspended period will not count towards their waste balance',
    buttonText: 'Suspend now',
    fallbackError:
      'There was a problem suspending the accreditation. Please try again.',
    formPayload: {},
    expectedBody: { fromStatus: 'approved', toStatus: 'suspended' }
  },
  {
    action: 'reapprove',
    heading: 'Reapprove accreditation',
    warningText:
      'This action must only be taken following the required legal process for lifting a suspension and following instruction from an industry regulator. Lifting a suspension for an operator will reinstate their ability to issue PRNs and declared tonnages newly submitted will then count towards their waste balance. Tonnages during the suspended period will not count towards their waste balance',
    buttonText: 'Reapprove now',
    fallbackError:
      'There was a problem reapproving the accreditation. Please try again.',
    formPayload: {},
    expectedBody: { fromStatus: 'suspended', toStatus: 'approved' }
  },
  {
    action: 'cancel',
    heading: 'Cancel accreditation',
    warningText:
      'This action must only be taken following the required legal process for cancellation and following instruction from an industry regulator. Cancelling an accreditation is permanent: the operator will no longer be able to issue PRNs and tonnages declared after the cancellation will not count towards their waste balance',
    buttonText: 'Cancel accreditation now',
    fallbackError:
      'There was a problem cancelling the accreditation. Please try again.',
    formPayload: {},
    expectedBody: { fromStatus: 'suspended', toStatus: 'cancelled' }
  },
  {
    action: 'reinstate',
    heading: 'Reinstate accreditation',
    warningText:
      'This action must only be taken where a cancellation has been overturned by the required legal process (for example a successful appeal through the courts) and following instruction from an industry regulator. Reinstating the operator will restore their ability to issue PRNs and newly declared tonnages will count towards their waste balance from the date of reinstatement. Tonnages dated during the cancelled period will not count towards their waste balance',
    buttonText: 'Reinstate now',
    fallbackError:
      'There was a problem reinstating the accreditation. Please try again.',
    formPayload: {},
    expectedBody: { fromStatus: 'cancelled', toStatus: 'approved' }
  },
  {
    action: 'reject',
    heading: 'Reject accreditation',
    warningText:
      'This action must only be taken following the required legal process for refusing an accreditation application and following instruction from an industry regulator. Rejecting an accreditation means the operator remains registered-only: they cannot issue PRNs and declared tonnages will not count towards a waste balance',
    buttonText: 'Reject now',
    fallbackError:
      'There was a problem rejecting the accreditation. Please try again.',
    formPayload: {},
    expectedBody: { fromStatus: 'created', toStatus: 'rejected' }
  },
  {
    action: 'reopen',
    heading: 'Reopen accreditation',
    warningText:
      'This action must only be taken following instruction from an industry regulator. Reopening a rejected accreditation returns the application to created so it can be reworked and reconsidered. The operator remains registered-only and cannot issue PRNs unless the accreditation is subsequently approved',
    buttonText: 'Reopen now',
    fallbackError:
      'There was a problem reopening the accreditation. Please try again.',
    formPayload: {},
    expectedBody: { fromStatus: 'rejected', toStatus: 'created' }
  }
]

describe('accreditation-status-transition', () => {
  const backendUrl = config.get('eprBackendUrl')
  const organisationId = 'aaa111bbb222ccc333ddd4444'
  const registrationId = 'eee555fff666ggg777hhh8888'
  const accreditationId = 'iii999jjj000kkk111lll2222'
  const overviewUrl = `/organisations/${organisationId}/registrations/${registrationId}/overview`
  const backendStatusHistoryUrl = `${backendUrl}/v1/organisations/${organisationId}/registrations/${registrationId}/accreditations/${accreditationId}/status-history`

  const readOnlySession = { ...mockUserSession, scopes: ['admin.read'] }

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
        () =>
          HttpResponse.json({
            id: organisationId,
            companyName: 'ACME Ltd',
            registrations: [
              {
                id: registrationId,
                status: 'approved',
                processingType: 'reprocessor',
                material: 'plastic',
                site: 'Site 1',
                accreditation: {
                  id: accreditationId,
                  accreditationNumber: 'ACC123',
                  status: 'approved'
                }
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
      ),
      http.get(
        `${backendUrl}/v1/organisations/${organisationId}/waste-balances`,
        () => HttpResponse.json({ [accreditationId]: null })
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
          { message: 'Cannot transition from suspended to suspended' },
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

  const writeAuth = { strategy: 'session', credentials: mockUserSession }
  const readAuth = { strategy: 'session', credentials: readOnlySession }

  const postTransition = async (
    action,
    formPayload = {},
    payloadOverrides = {}
  ) => {
    const confirmUrl = `/organisations/${organisationId}/registrations/${registrationId}/accreditations/${accreditationId}/${action}/confirm`
    const postUrl = `/organisations/${organisationId}/registrations/${registrationId}/accreditations/${accreditationId}/${action}`
    const { cookie, crumb } = await getCsrfToken(server, confirmUrl, writeAuth)
    const postResponse = await server.inject({
      method: 'POST',
      url: postUrl,
      auth: writeAuth,
      headers: { cookie },
      payload: { crumb, ...formPayload, ...payloadOverrides }
    })
    const postCookies = [postResponse.headers['set-cookie']]
      .flat()
      .filter(Boolean)
    const redirectCookie = postCookies.length
      ? postCookies.map((c) => c.split(';')[0]).join('; ')
      : cookie
    return { postResponse, redirectCookie }
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

  describe.each(TRANSITION_CASES)(
    '$action',
    ({
      action,
      heading,
      warningText,
      buttonText,
      fallbackError,
      formPayload,
      expectedBody
    }) => {
      const confirmUrl = `/organisations/${organisationId}/registrations/${registrationId}/accreditations/${accreditationId}/${action}/confirm`
      const postUrl = `/organisations/${organisationId}/registrations/${registrationId}/accreditations/${accreditationId}/${action}`

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

      test(`confirm page renders the warning copy verbatim with ${buttonText} and Cancel actions`, async () => {
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
        expect($('form').attr('action')).toBe(postUrl)
        expect($(`button:contains("${buttonText}")`).length).toBe(1)
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
        const { cookie, crumb } = await getCsrfToken(
          server,
          confirmUrl,
          readAuth
        )
        const { statusCode } = await server.inject({
          method: 'POST',
          url: postUrl,
          auth: readAuth,
          headers: { cookie },
          payload: { crumb }
        })
        expect(statusCode).toBe(statusCodes.forbidden)
      })

      test(`successful ${action} posts the from/to transition to the backend status-history endpoint and redirects to the overview`, async () => {
        vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
        const receivedBodies = []
        stubTransitionSuccess(expectedBody.toStatus, receivedBodies)

        const { postResponse } = await postTransition(action, formPayload)
        expect(postResponse.statusCode).toBe(statusCodes.found)
        expect(postResponse.headers.location).toBe(overviewUrl)
        expect(receivedBodies).toEqual([expectedBody])
      })

      test(`failed ${action} when the backend is unreachable falls back to the generic flash error`, async () => {
        vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
        mswServer.use(
          http.post(backendStatusHistoryUrl, () => HttpResponse.error())
        )

        const { postResponse, redirectCookie } = await postTransition(
          action,
          formPayload
        )
        expect(postResponse.statusCode).toBe(statusCodes.found)
        expect(postResponse.headers.location).toBe(overviewUrl)

        await expectOverviewFlash(redirectCookie, fallbackError)
      })
    }
  )

  describe.each(TRANSITION_CASES.filter((c) => !c.hasGrantFields))(
    '$action backend rejection',
    ({ action, fallbackError }) => {
      test('redirects to the overview and shows the backend message as a flash error', async () => {
        vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
        stubTransitionFailure()

        const { postResponse, redirectCookie } = await postTransition(action)
        expect(postResponse.statusCode).toBe(statusCodes.found)
        expect(postResponse.headers.location).toBe(overviewUrl)

        await expectOverviewFlash(
          redirectCookie,
          'Cannot transition from suspended to suspended'
        )
      })

      test('without a backend message falls back to a generic flash error', async () => {
        vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
        stubTransitionFailureWithoutMessage()

        const { postResponse, redirectCookie } = await postTransition(action)
        expect(postResponse.statusCode).toBe(statusCodes.found)
        expect(postResponse.headers.location).toBe(overviewUrl)

        await expectOverviewFlash(redirectCookie, fallbackError)
      })

      test('with a non-object error body falls back to the generic flash error', async () => {
        vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
        mswServer.use(
          http.post(backendStatusHistoryUrl, () =>
            HttpResponse.json(null, { status: 422 })
          )
        )

        const { postResponse, redirectCookie } = await postTransition(action)
        expect(postResponse.statusCode).toBe(statusCodes.found)
        expect(postResponse.headers.location).toBe(overviewUrl)

        await expectOverviewFlash(redirectCookie, fallbackError)
      })
    }
  )

  describe('approve grant fields', () => {
    const confirmUrl = `/organisations/${organisationId}/registrations/${registrationId}/accreditations/${accreditationId}/approve/confirm`
    const postUrl = `/organisations/${organisationId}/registrations/${registrationId}/accreditations/${accreditationId}/approve`

    const validFormPayload = {
      'appliesFrom-day': '1',
      'appliesFrom-month': '8',
      'appliesFrom-year': '2026',
      accreditationNumber: 'ACC999999'
    }

    const postApprove = async (payloadOverrides) => {
      const { cookie, crumb } = await getCsrfToken(
        server,
        confirmUrl,
        writeAuth
      )
      return server.inject({
        method: 'POST',
        url: postUrl,
        auth: writeAuth,
        headers: { cookie },
        payload: { crumb, ...validFormPayload, ...payloadOverrides }
      })
    }

    test('confirm page renders the applies from date input and accreditation number field', async () => {
      vi.mocked(getUserSession).mockResolvedValue(mockUserSession)

      const { result } = await server.inject({
        method: 'GET',
        url: confirmUrl,
        auth: writeAuth
      })

      const $ = cheerio.load(result)
      expect($('input[name="appliesFrom-day"]')).toHaveLength(1)
      expect($('input[name="appliesFrom-month"]')).toHaveLength(1)
      expect($('input[name="appliesFrom-year"]')).toHaveLength(1)
      expect($('input[name="accreditationNumber"]')).toHaveLength(1)
    })

    test('suspend confirm page does not render the grant fields', async () => {
      vi.mocked(getUserSession).mockResolvedValue(mockUserSession)

      const { result } = await server.inject({
        method: 'GET',
        url: `/organisations/${organisationId}/registrations/${registrationId}/accreditations/${accreditationId}/suspend/confirm`,
        auth: writeAuth
      })

      const $ = cheerio.load(result)
      expect($('input[name="appliesFrom-day"]')).toHaveLength(0)
      expect($('input[name="accreditationNumber"]')).toHaveLength(0)
    })

    test('missing accreditation number re-renders the page with an error, preserving the date', async () => {
      vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
      const receivedBodies = []
      stubTransitionSuccess('approved', receivedBodies)

      const response = await postApprove({ accreditationNumber: '  ' })

      expect(response.statusCode).toBe(statusCodes.badRequest)
      const $ = cheerio.load(response.result)
      expect($('.govuk-error-summary').text()).toContain(
        'Enter an accreditation number'
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
        expect($('input[name="accreditationNumber"]').attr('value')).toBe(
          'ACC999999'
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
        accreditationNumber: ''
      })

      expect(response.statusCode).toBe(statusCodes.badRequest)
      const $ = cheerio.load(response.result)
      const summary = $('.govuk-error-summary').text()
      expect(summary).toContain('Enter a valid applies from date')
      expect(summary).toContain('Enter an accreditation number')
    })

    test('a submission without any grant fields lists both errors in the summary', async () => {
      vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
      const { cookie, crumb } = await getCsrfToken(
        server,
        confirmUrl,
        writeAuth
      )

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
      expect(summary).toContain('Enter an accreditation number')
    })

    test('a backend rejection re-renders the page with the backend message, preserving input', async () => {
      vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
      mswServer.use(
        http.post(backendStatusHistoryUrl, () =>
          HttpResponse.json(
            { message: 'Accreditation number ACC999999 is already in use' },
            { status: 422 }
          )
        )
      )

      const response = await postApprove()

      expect(response.statusCode).toBe(statusCodes.badRequest)
      const $ = cheerio.load(response.result)
      expect($('.govuk-error-summary').text()).toContain(
        'Accreditation number ACC999999 is already in use'
      )
      expect($('input[name="appliesFrom-day"]').attr('value')).toBe('1')
      expect($('input[name="appliesFrom-month"]').attr('value')).toBe('8')
      expect($('input[name="appliesFrom-year"]').attr('value')).toBe('2026')
      expect($('input[name="accreditationNumber"]').attr('value')).toBe(
        'ACC999999'
      )
    })

    test('a backend rejection without a message re-renders the page with the generic error', async () => {
      vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
      stubTransitionFailureWithoutMessage()

      const response = await postApprove()

      expect(response.statusCode).toBe(statusCodes.badRequest)
      const $ = cheerio.load(response.result)
      expect($('.govuk-error-summary').text()).toContain(
        'There was a problem approving the accreditation. Please try again.'
      )
    })

    test('a backend 5xx failure redirects to the overview with the generic flash error', async () => {
      vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
      stubTransitionFailure(statusCodes.internalServerError)

      const { postResponse, redirectCookie } = await postTransition(
        'approve',
        validFormPayload
      )
      expect(postResponse.statusCode).toBe(statusCodes.found)
      expect(postResponse.headers.location).toBe(overviewUrl)

      await expectOverviewFlash(
        redirectCookie,
        'There was a problem approving the accreditation. Please try again.'
      )
    })
  })
})
