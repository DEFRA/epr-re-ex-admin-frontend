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

  const BASE_URL = `/organisations/${organisationId}/registrations/${registrationId}/reports/${year}/${cadence}/${period}`
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
    config.set('featureFlagReportUnsubmit', true)
    createMockOidcServer()
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    config.set('featureFlagReportUnsubmit', false)
    await server.stop({ timeout: 0 })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const stubOverview = () => {
    mswServer.use(
      http.get(
        `${backendUrl}/v1/organisations/${organisationId}/overview`,
        () => HttpResponse.json(mockOverview)
      )
    )
  }

  const stubUnsubmitSuccess = () => {
    mswServer.use(
      http.post(
        `${backendUrl}/v1/organisations/${organisationId}/registrations/${registrationId}/reports/${year}/${cadence}/${period}/unsubmit`,
        () => HttpResponse.json({ status: 'ready_to_submit' })
      )
    )
  }

  const stubUnsubmitConflict = () => {
    mswServer.use(
      http.post(
        `${backendUrl}/v1/organisations/${organisationId}/registrations/${registrationId}/reports/${year}/${cadence}/${period}/unsubmit`,
        () => HttpResponse.json({ error: 'Conflict' }, { status: 409 })
      )
    )
  }

  const stubUnsubmitNotFound = () => {
    mswServer.use(
      http.post(
        `${backendUrl}/v1/organisations/${organisationId}/registrations/${registrationId}/reports/${year}/${cadence}/${period}/unsubmit`,
        () => HttpResponse.json({ error: 'Not found' }, { status: 404 })
      )
    )
  }

  const stubUnsubmitServerError = () => {
    mswServer.use(
      http.post(
        `${backendUrl}/v1/organisations/${organisationId}/registrations/${registrationId}/reports/${year}/${cadence}/${period}/unsubmit`,
        () => HttpResponse.json({ error: 'Internal error' }, { status: 500 })
      )
    )
  }

  const stubOverviewNoRegistration = () => {
    mswServer.use(
      http.get(
        `${backendUrl}/v1/organisations/${organisationId}/overview`,
        () => HttpResponse.json({ ...mockOverview, registrations: [] })
      )
    )
  }

  const authOptions = { strategy: 'session', credentials: mockUserSession }

  /**
   * Extracts the updated session cookie from a POST response so the flash
   * data written by yar is available to the subsequent GET.
   */
  const sessionCookieAfterPost = (postResponse, fallbackCookie) => {
    const setCookies = [postResponse.headers['set-cookie']]
      .flat()
      .filter(Boolean)
    return setCookies.length
      ? setCookies.map((c) => c.split(';')[0]).join('; ')
      : fallbackCookie
  }

  describe('GET .../unsubmit/confirm', () => {
    describe('when unauthenticated', () => {
      test('returns 401', async () => {
        const { statusCode } = await server.inject({
          method: 'GET',
          url: confirmUrl
        })
        expect(statusCode).toBe(statusCodes.unauthorised)
      })
    })

    describe('when authenticated', () => {
      beforeEach(() => {
        getUserSession.mockReturnValue(mockUserSession)
        stubOverview()
      })

      test('returns 200 with heading', async () => {
        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: confirmUrl,
          auth: authOptions
        })

        expect(statusCode).toBe(statusCodes.ok)
        const $ = cheerio.load(result)
        expect($('h1').text().trim()).toBe('Unsubmit report')
      })

      test('shows registration number and period details', async () => {
        const { result } = await server.inject({
          method: 'GET',
          url: confirmUrl,
          auth: authOptions
        })

        expect(result).toContain('E25SR500020912PA')
        expect(result).toContain('January')
        expect(result).toContain(year)
      })

      test('form action points to POST url', async () => {
        const { result } = await server.inject({
          method: 'GET',
          url: confirmUrl,
          auth: authOptions
        })

        const $ = cheerio.load(result)
        expect($('form').attr('action')).toBe(postUrl)
      })

      test('cancel link goes to overview', async () => {
        const { result } = await server.inject({
          method: 'GET',
          url: confirmUrl,
          auth: authOptions
        })

        const $ = cheerio.load(result)
        expect($('a:contains("Cancel")').attr('href')).toBe(overviewUrl)
      })

      test('shows warning text about consequences', async () => {
        const { result } = await server.inject({
          method: 'GET',
          url: confirmUrl,
          auth: authOptions
        })

        expect(result).toContain('ready to submit')
      })

      test('falls back to registrationId when registration not found in overview', async () => {
        stubOverviewNoRegistration()

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: confirmUrl,
          auth: authOptions
        })

        expect(statusCode).toBe(statusCodes.ok)
        expect(result).toContain(registrationId)
      })
    })
  })

  describe('POST .../unsubmit', () => {
    beforeEach(() => {
      getUserSession.mockReturnValue(mockUserSession)
      stubOverview()
    })

    test('redirects to result page on backend success', async () => {
      stubUnsubmitSuccess()
      const { cookie, crumb } = await getCsrfToken(
        server,
        confirmUrl,
        authOptions
      )

      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: postUrl,
        auth: authOptions,
        headers: { cookie },
        payload: { crumb }
      })

      expect(statusCode).toBe(statusCodes.found)
      expect(headers.location).toBe(resultUrl)
    })

    test('redirects to result page on backend 409 conflict', async () => {
      stubUnsubmitConflict()
      const { cookie, crumb } = await getCsrfToken(
        server,
        confirmUrl,
        authOptions
      )

      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: postUrl,
        auth: authOptions,
        headers: { cookie },
        payload: { crumb }
      })

      expect(statusCode).toBe(statusCodes.found)
      expect(headers.location).toBe(resultUrl)
    })

    test('redirects to result page on backend 404', async () => {
      stubUnsubmitNotFound()
      const { cookie, crumb } = await getCsrfToken(
        server,
        confirmUrl,
        authOptions
      )

      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: postUrl,
        auth: authOptions,
        headers: { cookie },
        payload: { crumb }
      })

      expect(statusCode).toBe(statusCodes.found)
      expect(headers.location).toBe(resultUrl)
    })

    test('redirects to result page on unexpected backend error', async () => {
      stubUnsubmitServerError()
      const { cookie, crumb } = await getCsrfToken(
        server,
        confirmUrl,
        authOptions
      )

      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: postUrl,
        auth: authOptions,
        headers: { cookie },
        payload: { crumb }
      })

      expect(statusCode).toBe(statusCodes.found)
      expect(headers.location).toBe(resultUrl)
    })
  })

  describe('GET .../unsubmit/result', () => {
    beforeEach(() => {
      getUserSession.mockReturnValue(mockUserSession)
      stubOverview()
    })

    test('shows success panel when unsubmit succeeds', async () => {
      stubUnsubmitSuccess()
      const { cookie, crumb } = await getCsrfToken(
        server,
        confirmUrl,
        authOptions
      )

      const postResponse = await server.inject({
        method: 'POST',
        url: postUrl,
        auth: authOptions,
        headers: { cookie },
        payload: { crumb }
      })

      const resultCookie = sessionCookieAfterPost(postResponse, cookie)

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: resultUrl,
        auth: authOptions,
        headers: { cookie: resultCookie }
      })

      expect(statusCode).toBe(statusCodes.ok)
      const $ = cheerio.load(result)
      expect($('.govuk-panel__title').text().trim()).toBe('Report unsubmitted')
      expect(result).toContain('E25SR500020912PA')
    })

    test('shows error banner when unsubmit fails with 409', async () => {
      stubUnsubmitConflict()
      const { cookie, crumb } = await getCsrfToken(
        server,
        confirmUrl,
        authOptions
      )

      const postResponse = await server.inject({
        method: 'POST',
        url: postUrl,
        auth: authOptions,
        headers: { cookie },
        payload: { crumb }
      })

      const resultCookie = sessionCookieAfterPost(postResponse, cookie)

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: resultUrl,
        auth: authOptions,
        headers: { cookie: resultCookie }
      })

      expect(statusCode).toBe(statusCodes.ok)
      expect(result).toContain('govuk-panel--error')
      expect(result).toContain('not in a submitted state')
    })

    test('redirects to overview when accessed directly without prior POST', async () => {
      const { statusCode, headers } = await server.inject({
        method: 'GET',
        url: resultUrl,
        auth: authOptions
      })

      expect(statusCode).toBe(statusCodes.found)
      expect(headers.location).toBe(overviewUrl)
    })

    test('shows back to overview link after successful POST', async () => {
      stubUnsubmitSuccess()
      const { cookie, crumb } = await getCsrfToken(
        server,
        confirmUrl,
        authOptions
      )

      const postResponse = await server.inject({
        method: 'POST',
        url: postUrl,
        auth: authOptions,
        headers: { cookie },
        payload: { crumb }
      })

      const resultCookie = sessionCookieAfterPost(postResponse, cookie)

      const { result } = await server.inject({
        method: 'GET',
        url: resultUrl,
        auth: authOptions,
        headers: { cookie: resultCookie }
      })

      const $ = cheerio.load(result)
      expect(
        $('a:contains("Back to registration overview")').attr('href')
      ).toBe(overviewUrl)
    })

    test('falls back to registrationId when registration not found in overview', async () => {
      stubUnsubmitSuccess()
      const { cookie, crumb } = await getCsrfToken(
        server,
        confirmUrl,
        authOptions
      )

      const postResponse = await server.inject({
        method: 'POST',
        url: postUrl,
        auth: authOptions,
        headers: { cookie },
        payload: { crumb }
      })

      const resultCookie = sessionCookieAfterPost(postResponse, cookie)

      stubOverviewNoRegistration()

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: resultUrl,
        auth: authOptions,
        headers: { cookie: resultCookie }
      })

      expect(statusCode).toBe(statusCodes.ok)
      expect(result).toContain(registrationId)
    })
  })

  describe('when feature flag is disabled', () => {
    beforeAll(() => {
      config.set('featureFlagReportUnsubmit', false)
    })

    afterAll(() => {
      config.set('featureFlagReportUnsubmit', true)
    })

    beforeEach(() => {
      getUserSession.mockReturnValue(mockUserSession)
    })

    test('GET confirm returns 404', async () => {
      const { statusCode } = await server.inject({
        method: 'GET',
        url: confirmUrl,
        auth: authOptions
      })
      expect(statusCode).toBe(statusCodes.notFound)
    })

    test('POST returns 404', async () => {
      mswServer.use(
        http.get(
          `${backendUrl}/v1/organisations/${organisationId}/overview`,
          () => HttpResponse.json(mockOverview)
        )
      )
      // Fetch a valid crumb from any authenticated GET route
      const { cookie, crumb } = await getCsrfToken(
        server,
        `/organisations/${organisationId}/overview`,
        authOptions
      )

      const { statusCode } = await server.inject({
        method: 'POST',
        url: postUrl,
        auth: authOptions,
        headers: { cookie },
        payload: { crumb }
      })
      expect(statusCode).toBe(statusCodes.notFound)
    })

    test('GET result returns 404', async () => {
      const { statusCode } = await server.inject({
        method: 'GET',
        url: resultUrl,
        auth: authOptions
      })
      expect(statusCode).toBe(statusCodes.notFound)
    })
  })
})
