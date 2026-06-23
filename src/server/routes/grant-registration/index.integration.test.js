import { vi } from 'vitest'
import * as cheerio from 'cheerio'
import { config } from '#config/config.js'
import { statusCodes } from '#server/common/constants/status-codes.js'
import { mockUserSession } from '#server/common/test-helpers/fixtures.js'
import { getUserSession } from '#server/common/helpers/auth/get-user-session.js'
import { createMockOidcServer } from '#server/common/test-helpers/mock-oidc.js'
import { http, server as mswServer, HttpResponse } from '#vite/setup-msw.js'
import { createServer } from '#server/server.js'

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
    getUserSession.mockReturnValue(readOnlySession)
    const { statusCode } = await server.inject({
      method: 'GET',
      url: confirmUrl,
      auth: { strategy: 'session', credentials: readOnlySession }
    })
    expect(statusCode).toBe(statusCodes.forbidden)
  })

  test('confirm page shows the status change, reason field and hidden version', async () => {
    getUserSession.mockReturnValue(mockUserSession)
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
    getUserSession.mockReturnValue(mockUserSession)
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
    getUserSession.mockReturnValue(mockUserSession)
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
})
