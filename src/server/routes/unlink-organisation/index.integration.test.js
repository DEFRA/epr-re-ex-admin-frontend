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

describe('unlink-organisation', () => {
  const backendUrl = config.get('eprBackendUrl')
  const organisationId = 'aaa111bbb222ccc333ddd4444'
  const overviewUrl = `/organisations/${organisationId}/overview`
  const confirmUrl = `/organisations/${organisationId}/unlink-defra-id/confirm`
  const postUrl = `/organisations/${organisationId}/unlink-defra-id`

  const readOnlySession = { ...mockUserSession, scopes: ['admin.read'] }

  const linkedOverview = {
    id: organisationId,
    companyName: 'ACME Ltd',
    registrations: [],
    linkedDefraOrganisation: {
      orgId: '550e8400-e29b-41d4-a716-446655440001',
      orgName: 'Lost Ark Adventures Ltd',
      linkedAt: '2026-05-01T12:00:00.000Z',
      linkedBy: { email: 'linker@example.com' }
    }
  }

  const unlinkedOverview = {
    id: organisationId,
    companyName: 'ACME Ltd',
    registrations: []
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

  const stubOverview = (overview) =>
    mswServer.use(
      http.get(
        `${backendUrl}/v1/organisations/${organisationId}/overview`,
        () => HttpResponse.json(overview)
      )
    )

  const stubDeleteSuccess = () =>
    mswServer.use(
      http.delete(
        `${backendUrl}/v1/organisations/${organisationId}/link`,
        () => new HttpResponse(null, { status: 204 })
      )
    )

  const stubDeleteFailure = (status = 409) =>
    mswServer.use(
      http.delete(`${backendUrl}/v1/organisations/${organisationId}/link`, () =>
        HttpResponse.json({ error: 'Conflict' }, { status })
      )
    )

  const writeAuth = { strategy: 'session', credentials: mockUserSession }
  const readAuth = { strategy: 'session', credentials: readOnlySession }

  const postUnlink = async () => {
    const { cookie, crumb } = await getCsrfToken(server, confirmUrl, writeAuth)
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
    getUserSession.mockReturnValue(readOnlySession)
    const { statusCode } = await server.inject({
      method: 'GET',
      url: confirmUrl,
      auth: readAuth
    })
    expect(statusCode).toBe(statusCodes.forbidden)
  })

  test('confirm page shows the organisation and Defra ID org names', async () => {
    getUserSession.mockReturnValue(mockUserSession)
    stubOverview(linkedOverview)

    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: confirmUrl,
      auth: writeAuth
    })

    expect(statusCode).toBe(statusCodes.ok)
    const $ = cheerio.load(result)
    expect($('h1').text().trim()).toBe('Unlink organisation from Defra ID')
    expect(result).toContain('ACME Ltd')
    expect(result).toContain('Lost Ark Adventures Ltd')
    expect($('form').attr('action')).toBe(postUrl)
    expect($('a:contains("Cancel")').attr('href')).toBe(overviewUrl)
  })

  test('confirm page redirects to overview when the org is not linked', async () => {
    getUserSession.mockReturnValue(mockUserSession)
    stubOverview(unlinkedOverview)

    const { statusCode, headers } = await server.inject({
      method: 'GET',
      url: confirmUrl,
      auth: writeAuth
    })

    expect(statusCode).toBe(statusCodes.found)
    expect(headers.location).toBe(overviewUrl)
  })

  test('POST is rejected with 401 when unauthenticated', async () => {
    const { statusCode } = await server.inject({
      method: 'POST',
      url: postUrl
    })
    expect(statusCode).toBe(statusCodes.unauthorised)
  })

  test('successful unlink redirects to overview and shows a success banner', async () => {
    getUserSession.mockReturnValue(mockUserSession)
    stubOverview(linkedOverview)
    stubDeleteSuccess()

    const { postResponse, redirectCookie } = await postUnlink()
    expect(postResponse.statusCode).toBe(statusCodes.found)
    expect(postResponse.headers.location).toBe(overviewUrl)

    stubOverview(unlinkedOverview)
    const { result } = await server.inject({
      method: 'GET',
      url: overviewUrl,
      headers: { cookie: redirectCookie },
      auth: writeAuth
    })

    const $ = cheerio.load(result)
    expect($('[data-module="govuk-notification-banner"]').text()).toContain(
      'Organisation unlinked from Defra ID'
    )
  })

  test('failed unlink redirects to overview and shows an error banner', async () => {
    getUserSession.mockReturnValue(mockUserSession)
    stubOverview(linkedOverview)
    stubDeleteFailure()

    const { postResponse, redirectCookie } = await postUnlink()
    expect(postResponse.statusCode).toBe(statusCodes.found)
    expect(postResponse.headers.location).toBe(overviewUrl)

    stubOverview(linkedOverview)
    const { result } = await server.inject({
      method: 'GET',
      url: overviewUrl,
      headers: { cookie: redirectCookie },
      auth: writeAuth
    })

    const $ = cheerio.load(result)
    expect($('[data-module="govuk-notification-banner"]').text()).toContain(
      'could not be unlinked'
    )
  })
})
