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
  const organisationId = '6507f1f77bcf86cd79943901'
  const organisationNumber = '500123'
  const overviewUrl = `/organisations/${organisationNumber}/overview`
  const confirmUrl = `/organisations/${organisationNumber}/unlink-defra-id/confirm`
  const postUrl = `/organisations/${organisationNumber}/unlink-defra-id`

  const readOnlySession = { ...mockUserSession, scopes: ['admin.read'] }

  const unlinkedView = {
    name: 'ACME Ltd',
    organisationNumber,
    registrations: {}
  }

  const linkedView = {
    ...unlinkedView,
    linkedDefraOrganisation: {
      defraOrganisation: {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Lost Ark Adventures Ltd'
      },
      linkedAt: '2026-05-01T12:00:00.000Z',
      linkedBy: { email: 'linker@example.com' }
    }
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

  /** @param {object} view */
  const stubView = (view) =>
    mswServer.use(
      http.get(`${backendUrl}/organisations/${organisationNumber}`, () =>
        HttpResponse.json(view)
      )
    )

  const stubDeleteSuccess = () =>
    mswServer.use(
      http.delete(
        `${backendUrl}/organisations/${organisationNumber}/link`,
        () => new HttpResponse(null, { status: 204 })
      )
    )

  const stubDeleteFailure = (status = 409) =>
    mswServer.use(
      http.delete(
        `${backendUrl}/organisations/${organisationNumber}/link`,
        () => HttpResponse.json({ error: 'Conflict' }, { status })
      )
    )

  const stubStoredOrganisation = () =>
    mswServer.use(
      http.get(`${backendUrl}/v1/organisations/${organisationId}`, () =>
        HttpResponse.json({
          id: organisationId,
          orgId: 500123,
          registrations: [],
          accreditations: []
        })
      )
    )

  const writeAuth = { strategy: 'session', credentials: mockUserSession }
  const readAuth = { strategy: 'session', credentials: readOnlySession }

  /** @param {string} [url] */
  const postUnlink = async (url = postUrl) => {
    const { cookie, crumb } = await getCsrfToken(server, confirmUrl, writeAuth)

    /** @type {string[]} */
    const backendCalls = []
    /** @param {{ request: Request }} event */
    const record = ({ request }) => {
      backendCalls.push(`${request.method} ${new URL(request.url).pathname}`)
    }
    mswServer.events.on('request:start', record)

    const postResponse = await server.inject({
      method: 'POST',
      url,
      auth: writeAuth,
      headers: { cookie },
      payload: { crumb }
    })

    mswServer.events.removeListener('request:start', record)

    const postCookies = [postResponse.headers['set-cookie']]
      .flat()
      .filter(Boolean)
    const redirectCookie = postCookies.length
      ? postCookies.map((c) => c.split(';')[0]).join('; ')
      : cookie
    return { postResponse, redirectCookie, backendCalls }
  }

  /** @param {string} redirectCookie */
  const bannerAfterRedirect = async (redirectCookie) => {
    stubView(unlinkedView)
    const { result } = await server.inject({
      method: 'GET',
      url: overviewUrl,
      headers: { cookie: redirectCookie },
      auth: writeAuth
    })

    return cheerio
      .load(result)('[data-module="govuk-notification-banner"]')
      .text()
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

  test('confirm page shows the organisation and Defra ID org names', async () => {
    vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
    stubView(linkedView)

    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: confirmUrl,
      auth: writeAuth
    })

    expect(statusCode).toBe(statusCodes.ok)
    const $ = cheerio.load(result)
    expect($('h1').text().trim()).toBe('Unlink organisation from Defra ID')
    expect($('p strong').first().text()).toBe('ACME Ltd')
    expect($('p strong').last().text()).toBe('Lost Ark Adventures Ltd')
    expect($('form').attr('action')).toBe(postUrl)
    expect($('.govuk-breadcrumbs__link').last().attr('href')).toBe(overviewUrl)
  })

  test('confirm page redirects to overview when the org is not linked', async () => {
    vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
    stubView(unlinkedView)

    const { statusCode, headers } = await server.inject({
      method: 'GET',
      url: confirmUrl,
      auth: writeAuth
    })

    expect(statusCode).toBe(statusCodes.found)
    expect(headers.location).toBe(overviewUrl)
  })

  test('cancelling the confirm page returns to the organisation overview', async () => {
    vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
    stubView(linkedView)

    const confirmPage = await server.inject({
      method: 'GET',
      url: confirmUrl,
      auth: writeAuth
    })
    const cancelHref = cheerio
      .load(confirmPage.result)('a:contains("Cancel")')
      .attr('href')

    expect(cancelHref).toBe(overviewUrl)
  })

  test('POST is rejected with 401 when unauthenticated', async () => {
    const { statusCode } = await server.inject({
      method: 'POST',
      url: postUrl
    })
    expect(statusCode).toBe(statusCodes.unauthorised)
  })

  test('POST returns 403 for a read-only admin', async () => {
    vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
    stubView(linkedView)
    const { cookie, crumb } = await getCsrfToken(server, confirmUrl, writeAuth)
    vi.mocked(getUserSession).mockResolvedValue(readOnlySession)

    const { statusCode } = await server.inject({
      method: 'POST',
      url: postUrl,
      auth: readAuth,
      headers: { cookie },
      payload: { crumb }
    })

    expect(statusCode).toBe(statusCodes.forbidden)
  })

  test('successful unlink deletes the link, reading nothing else, and shows a success banner', async () => {
    vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
    stubView(linkedView)
    stubDeleteSuccess()

    const { postResponse, redirectCookie, backendCalls } = await postUnlink()

    expect(backendCalls).toStrictEqual([
      `DELETE /organisations/${organisationNumber}/link`
    ])
    expect(postResponse.statusCode).toBe(statusCodes.found)
    expect(postResponse.headers.location).toBe(overviewUrl)
    expect(await bannerAfterRedirect(redirectCookie)).toContain(
      'Organisation unlinked from Defra ID'
    )
  })

  test('failed unlink redirects to overview and shows an error banner', async () => {
    vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
    stubView(linkedView)
    stubDeleteFailure()

    const { postResponse, redirectCookie } = await postUnlink()

    expect(postResponse.statusCode).toBe(statusCodes.found)
    expect(postResponse.headers.location).toBe(overviewUrl)
    expect(await bannerAfterRedirect(redirectCookie)).toContain(
      'could not be unlinked'
    )
  })

  test('the old id address of the confirm page redirects to its number address', async () => {
    vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
    stubStoredOrganisation()

    const { statusCode, headers } = await server.inject({
      method: 'GET',
      url: `/organisations/${organisationId}/unlink-defra-id/confirm`,
      auth: writeAuth
    })

    expect(statusCode).toBe(statusCodes.found)
    expect(headers.location).toBe(confirmUrl)
  })

  test('a POST to the old id address is resent to its number address', async () => {
    vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
    stubView(linkedView)
    stubStoredOrganisation()

    const { postResponse } = await postUnlink(
      `/organisations/${organisationId}/unlink-defra-id`
    )

    expect(postResponse.statusCode).toBe(statusCodes.temporaryRedirect)
    expect(postResponse.headers.location).toBe(postUrl)
  })
})
