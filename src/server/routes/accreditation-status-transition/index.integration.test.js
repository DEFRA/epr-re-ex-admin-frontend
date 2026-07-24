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
    action: 'suspend',
    targetStatus: 'suspended',
    heading: 'Suspend accreditation',
    warningText:
      'This action must only be taken following the required legal process for suspension and following instruction from an industry regulator. Suspending an operator will remove their ability to issue PRNs and all declared tonnages submitted during the suspended period will not count towards their waste balance',
    buttonText: 'Suspend now',
    fallbackError:
      'There was a problem suspending the accreditation. Please try again.'
  },
  {
    action: 'reapprove',
    targetStatus: 'approved',
    heading: 'Reapprove accreditation',
    warningText:
      'This action must only be taken following the required legal process for lifting a suspension and following instruction from an industry regulator. Lifting a suspension for an operator will reinstate their ability to issue PRNs and declared tonnages newly submitted will then count towards their waste balance. Tonnages during the suspended period will not count towards their waste balance',
    buttonText: 'Reapprove now',
    fallbackError:
      'There was a problem reapproving the accreditation. Please try again.'
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

  describe.each(TRANSITION_CASES)(
    '$action',
    ({
      action,
      targetStatus,
      heading,
      warningText,
      buttonText,
      fallbackError
    }) => {
      const confirmUrl = `/organisations/${organisationId}/registrations/${registrationId}/accreditations/${accreditationId}/${action}/confirm`
      const postUrl = `/organisations/${organisationId}/registrations/${registrationId}/accreditations/${accreditationId}/${action}`

      const postTransition = async () => {
        const { cookie, crumb } = await getCsrfToken(
          server,
          confirmUrl,
          writeAuth
        )
        const postResponse = await server.inject({
          method: 'POST',
          url: postUrl,
          auth: writeAuth,
          headers: { cookie },
          payload: { crumb }
        })
        const postCookies = [postResponse.headers['set-cookie']]
          .flat()
          .filter(Boolean)
        const redirectCookie = postCookies.length
          ? postCookies.map((c) => c.split(';')[0]).join('; ')
          : cookie
        return { postResponse, redirectCookie }
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

      test(`successful ${action} posts { status: "${targetStatus}" } to the backend status-history endpoint and redirects to the overview`, async () => {
        vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
        const receivedBodies = []
        stubTransitionSuccess(targetStatus, receivedBodies)

        const { postResponse } = await postTransition()
        expect(postResponse.statusCode).toBe(statusCodes.found)
        expect(postResponse.headers.location).toBe(overviewUrl)
        expect(receivedBodies).toEqual([{ status: targetStatus }])
      })

      test(`failed ${action} redirects to the overview and shows a flash error`, async () => {
        vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
        stubTransitionFailure()

        const { postResponse, redirectCookie } = await postTransition()
        expect(postResponse.statusCode).toBe(statusCodes.found)
        expect(postResponse.headers.location).toBe(overviewUrl)

        stubOverview()
        stubCalendarAndSummaryLogs()
        const { result } = await server.inject({
          method: 'GET',
          url: overviewUrl,
          headers: { cookie: redirectCookie },
          auth: writeAuth
        })

        const $ = cheerio.load(result)
        expect($('.govuk-error-summary').text()).toContain(
          'Cannot transition from suspended to suspended'
        )
      })

      test(`failed ${action} without a backend message falls back to a generic flash error`, async () => {
        vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
        stubTransitionFailureWithoutMessage()

        const { postResponse, redirectCookie } = await postTransition()
        expect(postResponse.statusCode).toBe(statusCodes.found)
        expect(postResponse.headers.location).toBe(overviewUrl)

        stubOverview()
        stubCalendarAndSummaryLogs()
        const { result } = await server.inject({
          method: 'GET',
          url: overviewUrl,
          headers: { cookie: redirectCookie },
          auth: writeAuth
        })

        const $ = cheerio.load(result)
        expect($('.govuk-error-summary').text()).toContain(fallbackError)
      })

      test(`failed ${action} with a non-object error body falls back to the generic flash error`, async () => {
        vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
        mswServer.use(
          http.post(backendStatusHistoryUrl, () =>
            HttpResponse.json(null, { status: 422 })
          )
        )

        const { postResponse, redirectCookie } = await postTransition()
        expect(postResponse.statusCode).toBe(statusCodes.found)
        expect(postResponse.headers.location).toBe(overviewUrl)

        stubOverview()
        stubCalendarAndSummaryLogs()
        const { result } = await server.inject({
          method: 'GET',
          url: overviewUrl,
          headers: { cookie: redirectCookie },
          auth: writeAuth
        })

        const $ = cheerio.load(result)
        expect($('.govuk-error-summary').text()).toContain(fallbackError)
      })

      test(`failed ${action} when the backend is unreachable falls back to the generic flash error`, async () => {
        vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
        mswServer.use(
          http.post(backendStatusHistoryUrl, () => HttpResponse.error())
        )

        const { postResponse, redirectCookie } = await postTransition()
        expect(postResponse.statusCode).toBe(statusCodes.found)
        expect(postResponse.headers.location).toBe(overviewUrl)

        stubOverview()
        stubCalendarAndSummaryLogs()
        const { result } = await server.inject({
          method: 'GET',
          url: overviewUrl,
          headers: { cookie: redirectCookie },
          auth: writeAuth
        })

        const $ = cheerio.load(result)
        expect($('.govuk-error-summary').text()).toContain(fallbackError)
      })
    }
  )
})
