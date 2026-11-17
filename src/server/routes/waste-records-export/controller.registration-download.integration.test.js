import { config } from '#config/config.js'
import { statusCodes } from '#server/common/constants/status-codes.js'
import { getUserSession } from '#server/common/helpers/auth/get-user-session.js'
import { mockUserSession } from '#server/common/test-helpers/fixtures.js'
import { createMockOidcServer } from '#server/common/test-helpers/mock-oidc.js'
import { createServer } from '#server/server.js'
import { http, HttpResponse, server as mswServer } from '#vite/setup-msw.js'
import { vi } from 'vitest'

vi.mock('#server/common/helpers/auth/get-user-session.js', () => ({
  getUserSession: vi.fn().mockReturnValue(null)
}))

describe('the registration waste records download', () => {
  const originalBackendUrl = config.get('eprBackendUrl')
  const backendUrl = 'http://mock-backend'
  const registration = '/organisations/500123/registrations/R26ER5001180041PL'
  const auth = { strategy: 'session', credentials: mockUserSession }
  let server

  beforeAll(async () => {
    config.set('eprBackendUrl', backendUrl)
    createMockOidcServer()
    server = await createServer()
    await server.initialize()
    vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
  })

  afterAll(async () => {
    config.set('eprBackendUrl', originalBackendUrl)
    await server.stop({ timeout: 0 })
  })

  /** @param {string} url */
  const get = (url) => server.inject({ method: 'GET', url, auth })

  it("streams the year's export", async () => {
    /** @type {string[]} */
    const requested = []
    mswServer.use(
      http.get(
        `${backendUrl}${registration}/waste-records/export.csv`,
        ({ request }) => {
          requested.push(request.url)
          return new HttpResponse('header\n', {
            headers: { 'content-type': 'text/csv; charset=utf-8' }
          })
        }
      )
    )

    const { statusCode, payload } = await get(
      `${registration}/waste-records/download?year=2027`
    )

    expect(statusCode).toBe(statusCodes.ok)
    expect(payload).toBe('header\n')
    expect(requested).toStrictEqual([
      `${backendUrl}${registration}/waste-records/export.csv?year=2027`
    ])
  })

  it('does not exist for a year the backend refuses to export', async () => {
    mswServer.use(
      http.get(
        `${backendUrl}${registration}/waste-records/export.csv`,
        () =>
          new HttpResponse(null, { status: statusCodes.unprocessableEntity })
      )
    )

    const { statusCode } = await get(
      `${registration}/waste-records/download?year=2025`
    )

    expect(statusCode).toBe(statusCodes.notFound)
  })

  it.each([
    ['no year', ''],
    ['a two-digit year', '?year=26'],
    ['a year that is not a number', '?year=next']
  ])('refuses a download for %s', async (_, query) => {
    const { statusCode } = await get(
      `${registration}/waste-records/download${query}`
    )

    expect(statusCode).toBe(statusCodes.badRequest)
  })
})
