import { vi } from 'vitest'
import * as cheerio from 'cheerio'
import { config } from '#config/config.js'
import { mockUserSession } from '#server/common/test-helpers/fixtures.js'
import { getUserSession } from '#server/common/helpers/auth/get-user-session.js'
import { createMockOidcServer } from '#server/common/test-helpers/mock-oidc.js'
import { http, server as mswServer, HttpResponse } from '#vite/setup-msw.js'
import { createServer } from '#server/server.js'

vi.mock('#server/common/helpers/auth/get-user-session.js', () => ({
  getUserSession: vi.fn().mockReturnValue(null)
}))

vi.mock('#server/common/helpers/feature-flags.js', () => ({
  FEATURE_FLAGS: { prnAdminCancellation: true }
}))

describe('prn-activity Cancel link visibility', () => {
  const backendUrl = config.get('eprBackendUrl')
  const prnActivityUrl = '/prn-activity'
  const readOnlySession = { ...mockUserSession, scopes: ['admin.read'] }

  const buildPrn = (overrides = {}) => ({
    id: 'prn-id-1',
    prnNumber: 'ER26000123',
    status: 'accepted',
    tonnage: 5,
    material: 'plastic',
    accreditationNumber: 'ACC-2026-001',
    accreditationYear: 2026,
    organisationName: 'ACME Ltd',
    issuedToOrganisation: { name: 'Some Producer' },
    ...overrides
  })

  const stubPrnList = (prn) =>
    mswServer.use(
      http.get(`${backendUrl}/v1/admin/packaging-recycling-notes`, () =>
        HttpResponse.json({ items: [prn], hasMore: false })
      )
    )

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

  test('shows the Cancel link for an accepted PRN when the session has admin.write', async () => {
    vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
    stubPrnList(buildPrn())

    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: prnActivityUrl,
      auth: { strategy: 'session', credentials: mockUserSession }
    })

    expect(statusCode).toBe(200)
    const $ = cheerio.load(result)
    expect($('a:contains("Cancel")').attr('href')).toBe(
      '/prn-activity/prn-id-1/cancel/confirm?prnNumber=ER26000123&organisationName=ACME+Ltd&issuedTo=Some+Producer&tonnage=5&material=plastic&accreditationNumber=ACC-2026-001&accreditationYear=2026'
    )
  })

  test('hides the Cancel link when the PRN status is not accepted', async () => {
    vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
    stubPrnList(buildPrn({ status: 'cancelled' }))

    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: prnActivityUrl,
      auth: { strategy: 'session', credentials: mockUserSession }
    })

    expect(statusCode).toBe(200)
    const $ = cheerio.load(result)
    expect($('a:contains("Cancel")')).toHaveLength(0)
  })

  test('hides the Cancel link for a read-only (admin.read only) session', async () => {
    vi.mocked(getUserSession).mockResolvedValue(readOnlySession)
    stubPrnList(buildPrn())

    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: prnActivityUrl,
      auth: { strategy: 'session', credentials: readOnlySession }
    })

    expect(statusCode).toBe(200)
    const $ = cheerio.load(result)
    expect($('a:contains("Cancel")')).toHaveLength(0)
  })
})
