import { vi } from 'vitest'
import * as cheerio from 'cheerio'
import { config } from '#config/config.js'
import { statusCodes } from '#server/common/constants/status-codes.js'
import { mockUserSession } from '#server/common/test-helpers/fixtures.js'
import { getUserSession } from '#server/common/helpers/auth/get-user-session.js'
import { createMockOidcServer } from '#server/common/test-helpers/mock-oidc.js'
import { http, server as mswServer, HttpResponse } from '#vite/setup-msw.js'
import { createServer } from '#server/server.js'
import { getCsrfToken } from '#server/common/test-helpers/csrf-helper.js'

vi.mock('#server/common/helpers/auth/get-user-session.js', () => ({
  getUserSession: vi.fn().mockReturnValue(null)
}))

describe('grant-registration', () => {
  const backendUrl = config.get('eprBackendUrl')
  const organisationId = 'aaa111bbb222ccc333ddd4444'
  const registrationId = 'bbb222ccc333ddd444eee5555'

  const BASE_URL = `/organisations/${organisationId}/registrations/${registrationId}`
  const confirmUrl = `${BASE_URL}/approve/confirm`
  const postUrl = `${BASE_URL}/approve`
  const overviewUrl = `${BASE_URL}/overview`
  const statusHistoryPath = `/v1/organisations/${organisationId}/registrations/${registrationId}/status-history`

  const orgWith = (status) => ({
    id: organisationId,
    companyName: 'ACME Ltd',
    version: 7,
    registrations: [
      {
        id: registrationId,
        registrationNumber: 'E25SR500020912PA',
        status,
        material: 'paper',
        site: 'Site A',
        processingType: 'reprocessor'
      }
    ]
  })

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

  const readOnlySession = { ...mockUserSession, scopes: ['admin.read'] }

  const stubOrg = (status = 'created') =>
    mswServer.use(
      http.get(`${backendUrl}/v1/organisations/${organisationId}`, () =>
        HttpResponse.json(orgWith(status))
      )
    )

  const authOptions = { strategy: 'session', credentials: mockUserSession }

  test('unauthenticated requests are rejected', async () => {
    const { statusCode } = await server.inject({
      method: 'GET',
      url: confirmUrl
    })
    expect(statusCode).toBe(statusCodes.unauthorised)
  })

  test('read-only users get a 403', async () => {
    vi.mocked(getUserSession).mockReturnValue(readOnlySession)
    const { statusCode } = await server.inject({
      method: 'GET',
      url: confirmUrl,
      auth: { strategy: 'session', credentials: readOnlySession }
    })
    expect(statusCode).toBe(statusCodes.forbidden)
  })

  test('confirm page shows the status change, reason field and hidden version', async () => {
    vi.mocked(getUserSession).mockReturnValue(mockUserSession)
    stubOrg('created')

    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: confirmUrl,
      auth: authOptions
    })

    expect(statusCode).toBe(statusCodes.ok)
    const $ = cheerio.load(result)
    expect($('h1').text().trim()).toBe('Approve registration')
    expect(result).toContain('E25SR500020912PA')
    expect($('form').attr('action')).toBe(postUrl)
    expect($('input[name="version"]').attr('value')).toBe('7')
    expect($('#reason').length).toBe(1)
    expect($('a:contains("Cancel")').attr('href')).toBe(overviewUrl)
  })

  test('confirm page redirects to overview when status is not created', async () => {
    vi.mocked(getUserSession).mockReturnValue(mockUserSession)
    stubOrg('approved')

    const { statusCode, headers } = await server.inject({
      method: 'GET',
      url: confirmUrl,
      auth: authOptions
    })

    expect(statusCode).toBe(statusCodes.found)
    expect(headers.location).toBe(overviewUrl)
  })

  test('confirm page returns 404 when the registration is missing', async () => {
    vi.mocked(getUserSession).mockReturnValue(mockUserSession)
    mswServer.use(
      http.get(`${backendUrl}/v1/organisations/${organisationId}`, () =>
        HttpResponse.json({ ...orgWith('created'), registrations: [] })
      )
    )

    const { statusCode } = await server.inject({
      method: 'GET',
      url: confirmUrl,
      auth: authOptions
    })

    expect(statusCode).toBe(statusCodes.notFound)
  })

  const stubGrantFailure = (status, payload) =>
    mswServer.use(
      http.post(`${backendUrl}${statusHistoryPath}`, () =>
        HttpResponse.json(payload, { status })
      )
    )

  const postApprove = async (payload) => {
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
      payload: { crumb, ...payload }
    })
  }

  test('a valid grant calls the status-history endpoint and redirects to the overview', async () => {
    vi.mocked(getUserSession).mockReturnValue(mockUserSession)
    stubOrg('created')

    let captured
    mswServer.use(
      http.post(`${backendUrl}${statusHistoryPath}`, async ({ request }) => {
        captured = await request.json()
        return HttpResponse.json({ id: organisationId, version: 8 })
      })
    )

    const { statusCode, headers } = await postApprove({
      version: '7',
      reason: 'Documentation verified'
    })

    expect(statusCode).toBe(statusCodes.found)
    expect(headers.location).toBe(overviewUrl)
    expect(captured).toEqual({
      status: 'approved',
      reason: 'Documentation verified',
      version: 7
    })
  })

  test('an empty reason re-renders the confirm page with an error and makes no grant call', async () => {
    vi.mocked(getUserSession).mockReturnValue(mockUserSession)
    stubOrg('created')
    let grantCalled = false
    mswServer.use(
      http.post(`${backendUrl}${statusHistoryPath}`, () => {
        grantCalled = true
        return HttpResponse.json({})
      })
    )

    const { statusCode, result } = await postApprove({
      version: '7',
      reason: '   '
    })

    expect(statusCode).toBe(statusCodes.ok)
    expect(grantCalled).toBe(false)
    const $ = cheerio.load(result)
    expect($('.govuk-error-summary').length).toBe(1)
    expect(result).toContain('Enter a reason')
  })

  test('a version conflict re-renders the confirm page with a reload message', async () => {
    vi.mocked(getUserSession).mockReturnValue(mockUserSession)
    stubOrg('created')
    stubGrantFailure(statusCodes.conflict, { message: 'Version conflict' })

    const { statusCode, result } = await postApprove({
      version: '6',
      reason: 'Docs verified'
    })

    expect(statusCode).toBe(statusCodes.ok)
    const $ = cheerio.load(result)
    expect($('.govuk-error-summary').length).toBe(1)
    expect(result).toContain('changed since you opened it')
  })

  test('a backend rejection surfaces the backend message', async () => {
    vi.mocked(getUserSession).mockReturnValue(mockUserSession)
    stubOrg('created')
    stubGrantFailure(statusCodes.badRequest, {
      message: 'Multiple approved registrations found with duplicate keys'
    })

    const { statusCode, result } = await postApprove({
      version: '7',
      reason: 'Docs verified'
    })

    expect(statusCode).toBe(statusCodes.ok)
    expect(result).toContain(
      'Multiple approved registrations found with duplicate keys'
    )
  })

  test('a POST with no reason field re-renders with an error and makes no grant call', async () => {
    vi.mocked(getUserSession).mockReturnValue(mockUserSession)
    stubOrg('created')
    let grantCalled = false
    mswServer.use(
      http.post(`${backendUrl}${statusHistoryPath}`, () => {
        grantCalled = true
        return HttpResponse.json({})
      })
    )

    const { statusCode, result } = await postApprove({ version: '7' })

    expect(statusCode).toBe(statusCodes.ok)
    expect(grantCalled).toBe(false)
    const $ = cheerio.load(result)
    expect($('.govuk-error-summary').length).toBe(1)
    expect(result).toContain('Enter a reason')
  })

  test('a backend rejection with no message key surfaces the generic fallback message', async () => {
    vi.mocked(getUserSession).mockReturnValue(mockUserSession)
    stubOrg('created')
    stubGrantFailure(statusCodes.badRequest, {})

    const { statusCode, result } = await postApprove({
      version: '7',
      reason: 'Docs verified'
    })

    expect(statusCode).toBe(statusCodes.ok)
    expect(result).toContain(
      'The registration could not be approved. Try again.'
    )
  })
})
