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

vi.mock('#server/common/helpers/feature-flags.js', () => ({
  FEATURE_FLAGS: { prnAdminCancellation: true }
}))

describe('prn-cancel', () => {
  const backendUrl = config.get('eprBackendUrl')
  const prnId = 'aaa111bbb222ccc333ddd4444'
  const confirmUrl = `/prn-activity/${prnId}/cancel/confirm`
  const postUrl = `/prn-activity/${prnId}/cancel`

  const displayFields = {
    prnNumber: 'ER26000123',
    organisationName: 'ACME Ltd',
    issuedTo: 'Some Producer',
    tonnage: '500',
    material: 'plastic',
    accreditationNumber: 'ACC-2026-001',
    accreditationYear: '2026'
  }

  const confirmQuery = new URLSearchParams(displayFields).toString()

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

  const stubCancelSuccess = () =>
    mswServer.use(
      http.post(
        `${backendUrl}/v1/admin/packaging-recycling-notes/${prnId}/cancel`,
        () =>
          HttpResponse.json({
            id: prnId,
            prnNumber: displayFields.prnNumber,
            status: 'cancelled',
            tonnage: 500
          })
      )
    )

  const stubCancelFailure = (status, message) =>
    mswServer.use(
      http.post(
        `${backendUrl}/v1/admin/packaging-recycling-notes/${prnId}/cancel`,
        () => HttpResponse.json({ message }, { status })
      )
    )

  const writeAuth = { strategy: 'session', credentials: mockUserSession }
  const readAuth = { strategy: 'session', credentials: readOnlySession }

  const postCancel = async () => {
    const { cookie, crumb } = await getCsrfToken(
      server,
      `${confirmUrl}?${confirmQuery}`,
      writeAuth
    )
    return server.inject({
      method: 'POST',
      url: postUrl,
      auth: writeAuth,
      headers: { cookie },
      payload: { crumb, ...displayFields }
    })
  }

  test('confirm page is rejected with 401 when unauthenticated', async () => {
    const { statusCode } = await server.inject({
      method: 'GET',
      url: `${confirmUrl}?${confirmQuery}`
    })
    expect(statusCode).toBe(statusCodes.unauthorised)
  })

  test('confirm page returns 403 for a read-only admin', async () => {
    vi.mocked(getUserSession).mockResolvedValue(readOnlySession)
    const { statusCode } = await server.inject({
      method: 'GET',
      url: `${confirmUrl}?${confirmQuery}`,
      auth: readAuth
    })
    expect(statusCode).toBe(statusCodes.forbidden)
  })

  test('confirm page renders the PRN details, warning and form', async () => {
    vi.mocked(getUserSession).mockResolvedValue(mockUserSession)

    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: `${confirmUrl}?${confirmQuery}`,
      auth: writeAuth
    })

    expect(statusCode).toBe(statusCodes.ok)
    const $ = cheerio.load(result)
    expect($('h1').text()).toContain(displayFields.prnNumber)
    expect(result).toContain('cannot be undone')
    expect($('form').attr('action')).toBe(postUrl)
    expect($('a:contains("Return without cancelling")').attr('href')).toBe(
      '/prn-activity'
    )
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
      `${confirmUrl}?${confirmQuery}`,
      readAuth
    )
    const { statusCode } = await server.inject({
      method: 'POST',
      url: postUrl,
      auth: readAuth,
      headers: { cookie },
      payload: { crumb, ...displayFields }
    })
    expect(statusCode).toBe(statusCodes.forbidden)
  })

  test('successful cancellation renders the confirmation panel', async () => {
    vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
    stubCancelSuccess()

    const response = await postCancel()

    expect(response.statusCode).toBe(statusCodes.ok)
    const $ = cheerio.load(response.result)
    expect($('.govuk-panel--confirmation h1').text()).toBe('PRN cancelled')
    expect(response.result).toContain(displayFields.prnNumber)
    expect(response.result).toContain('credited back')
  })

  test('a 409 deadline refusal from the backend is shown verbatim', async () => {
    vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
    const deadlineMessage =
      'The deadline for a 2026 relevant year was 31 January 2027.'
    stubCancelFailure(409, deadlineMessage)

    const response = await postCancel()

    expect(response.statusCode).toBe(statusCodes.ok)
    const $ = cheerio.load(response.result)
    expect($('.app-panel--error h1').text()).toBe('Cancellation failed')
    expect(response.result).toContain(deadlineMessage)
  })

  test('a 409 wrong-status refusal from the backend is shown verbatim', async () => {
    vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
    const statusMessage =
      "Cannot cancel a PRN with status 'cancelled'; only an accepted or awaiting acceptance PRN can be cancelled"
    stubCancelFailure(409, statusMessage)

    const response = await postCancel()

    expect(response.statusCode).toBe(statusCodes.ok)
    // Nunjucks autoescapes the apostrophe in "status 'cancelled'", so assert
    // on the parts either side of it rather than the raw message.
    expect(response.result).toContain('Cannot cancel a PRN with status')
    expect(response.result).toContain(
      'only an accepted or awaiting acceptance PRN can be cancelled'
    )
  })

  test('a backend 500 falls back to a generic failure message', async () => {
    vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
    stubCancelFailure(500, 'Internal error detail the user should not see')

    const response = await postCancel()

    expect(response.statusCode).toBe(statusCodes.ok)
    expect(response.result).toContain('There was a problem cancelling the PRN')
    expect(response.result).not.toContain(
      'Internal error detail the user should not see'
    )
  })

  test('a backend-unreachable failure falls back to a generic failure message', async () => {
    vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
    mswServer.use(
      http.post(
        `${backendUrl}/v1/admin/packaging-recycling-notes/${prnId}/cancel`,
        () => HttpResponse.error()
      )
    )

    const response = await postCancel()

    expect(response.statusCode).toBe(statusCodes.ok)
    expect(response.result).toContain('There was a problem cancelling the PRN')
  })
})
