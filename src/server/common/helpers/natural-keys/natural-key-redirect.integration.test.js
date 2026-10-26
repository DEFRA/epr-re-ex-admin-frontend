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

describe('natural-key redirect from id addresses', () => {
  const originalBackendUrl = config.get('eprBackendUrl')
  const backendUrl = 'http://mock-backend'
  const organisationId = '69c3b4f0abda9efa68dd6697'
  const registrationId = '69c3b4f0abda9efa68dd669b'
  const accreditationId = '69c3b4f0abda9efa68dd6698'
  const organisationNumber = '500123'
  const registrationNumber = 'R26ER5001180041PL'
  const organisation = `/organisations/${organisationNumber}`
  const registration = `${organisation}/registrations/${registrationNumber}`
  const registrationById = `/organisations/${organisationId}/registrations/${registrationId}`
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

  /** @param {string | null} [number] */
  const stubOrganisation = (number = registrationNumber) =>
    mswServer.use(
      http.get(`${backendUrl}/v1/organisations/${organisationId}`, () =>
        HttpResponse.json({
          id: organisationId,
          orgId: 500123,
          registrations: [
            { id: registrationId, registrationNumber: number, accreditationId }
          ],
          accreditations: [
            {
              id: accreditationId,
              accreditationNumber: 'A26ER5001180114PL',
              validFrom: '2026-03-01'
            }
          ]
        })
      )
    )

  /** @param {string} url */
  const get = (url) => server.inject({ method: 'GET', url, auth })

  it.each([
    [
      'organisation overview',
      `/organisations/${organisationId}/overview`,
      `${organisation}/overview`
    ],
    [
      'registration overview',
      `${registrationById}/overview`,
      `${registration}/overview`
    ],
    [
      'unlink confirmation',
      `/organisations/${organisationId}/unlink-defra-id/confirm`,
      `${organisation}/unlink-defra-id/confirm`
    ],
    [
      'waste records download',
      `${registrationById}/waste-records/download`,
      `${registration}/waste-records/download`
    ],
    [
      'PRN activity download',
      `${registrationById}/accreditations/${accreditationId}/prn-activity/download`,
      `${registration}/accreditations/2026/prn-activity/download`
    ]
  ])('sends the %s to its natural-key address', async (_, url, location) => {
    stubOrganisation()

    const { statusCode, headers } = await get(url)

    expect(statusCode).toBe(statusCodes.found)
    expect(headers.location).toBe(location)
  })

  it('keeps the query string', async () => {
    stubOrganisation()

    const { headers } = await get(
      `/organisations/${organisationId}/overview?tab=users`
    )

    expect(headers.location).toBe(`${organisation}/overview?tab=users`)
  })

  it('keeps a slashed number as one segment', async () => {
    stubOrganisation('FAKE/REG500123/ALPHA')

    const { statusCode, headers } = await get(
      `${registrationById}/accreditations/${accreditationId}/waste-balance-events`
    )

    expect(statusCode).toBe(statusCodes.found)
    expect(headers.location).toBe(
      `${organisation}/registrations/FAKE%2FREG500123%2FALPHA/accreditations/2026/waste-balance-events`
    )
  })

  it('is not found for a registration with no number', async () => {
    stubOrganisation(null)

    const { statusCode } = await get(`${registrationById}/overview`)

    expect(statusCode).toBe(statusCodes.notFound)
  })

  it('is not found for an organisation the backend does not find', async () => {
    mswServer.use(
      http.get(`${backendUrl}/v1/organisations/${organisationId}`, () =>
        HttpResponse.json({}, { status: statusCodes.notFound })
      )
    )

    const { statusCode } = await get(
      `${registrationById}/reports/2026/quarterly/1/submissions/1`
    )

    expect(statusCode).toBe(statusCodes.notFound)
  })

  it('fails when the backend cannot look the organisation up', async () => {
    mswServer.use(
      http.get(`${backendUrl}/v1/organisations/${organisationId}`, () =>
        HttpResponse.json({}, { status: statusCodes.internalServerError })
      )
    )

    const { statusCode } = await get(
      `/organisations/${organisationId}/overview`
    )

    expect(statusCode).toBe(statusCodes.internalServerError)
  })

  it('does not redirect an address on a page still served by id alone', async () => {
    const { headers } = await get(`${registration}/approve/confirm`)

    expect(headers.location).toBeUndefined()
  })
})
