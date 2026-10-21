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

describe('natural-key redirect to pages still served by id', () => {
  const originalBackendUrl = config.get('eprBackendUrl')
  const backendUrl = 'http://mock-backend'
  const organisationId = '69c3b4f0abda9efa68dd6697'
  const registrationId = '69c3b4f0abda9efa68dd669b'
  const accreditationId = '69c3b4f0abda9efa68dd6698'
  const organisationNumber = '500123'
  const registrationNumber = 'R26ER5001180041PL'
  const registration = `/organisations/${organisationNumber}/registrations/${registrationNumber}`
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

  /** @param {Parameters<typeof HttpResponse.json>[0]} body */
  const stubSearch = (body) =>
    mswServer.use(
      http.get(`${backendUrl}/v1/organisations`, () => HttpResponse.json(body))
    )

  /** @param {string} [number] */
  const stubOverview = (number = registrationNumber) =>
    mswServer.use(
      http.get(
        `${backendUrl}/v1/organisations/${organisationId}/overview`,
        () =>
          HttpResponse.json({
            id: organisationId,
            organisationNumber,
            companyName: 'ACME ltd',
            registrations: [
              {
                id: registrationId,
                registrationNumber: number,
                accreditation: {
                  id: accreditationId,
                  accreditationNumber: 'A26ER5001180114PL',
                  year: 2026
                }
              }
            ]
          })
      )
    )

  /** @param {string} url */
  const get = (url) => server.inject({ method: 'GET', url, auth })

  describe('when the number finds the organisation', () => {
    beforeEach(() => {
      stubSearch({ items: [{ id: organisationId, orgId: 500123 }] })
      stubOverview()
    })

    it.each([
      [
        'organisation overview',
        `/organisations/${organisationNumber}/overview`,
        `/organisations/${organisationId}/overview`
      ],
      [
        'registration overview',
        `${registration}/overview`,
        `/organisations/${organisationId}/registrations/${registrationId}/overview`
      ],
      [
        'accreditation waste balance events',
        `${registration}/accreditations/2026/waste-balance-events`,
        `/organisations/${organisationId}/registrations/${registrationId}/accreditations/${accreditationId}/waste-balance-events`
      ]
    ])('sends the %s to its id address', async (_, url, location) => {
      const { statusCode, headers } = await get(url)

      expect(statusCode).toBe(statusCodes.found)
      expect(headers.location).toBe(location)
    })

    it('keeps the query string', async () => {
      const { headers } = await get(
        `/organisations/${organisationNumber}/overview?tab=users`
      )

      expect(headers.location).toBe(
        `/organisations/${organisationId}/overview?tab=users`
      )
    })

    it('sends a registration numbered in no particular format to its id address', async () => {
      stubOverview('REG-50030-001')

      const { statusCode, headers } = await get(
        `/organisations/${organisationNumber}/registrations/REG-50030-001/overview`
      )

      expect(statusCode).toBe(statusCodes.found)
      expect(headers.location).toBe(
        `/organisations/${organisationId}/registrations/${registrationId}/overview`
      )
    })

    it('is not found for a registration the organisation does not hold', async () => {
      const { statusCode } = await get(
        `/organisations/${organisationNumber}/registrations/R26ER9999999999PL/overview`
      )

      expect(statusCode).toBe(statusCodes.notFound)
    })
  })

  it.each([
    ['finds no organisation', { items: [] }],
    [
      'finds a different organisation',
      { items: [{ id: organisationId, orgId: 5001239 }] }
    ]
  ])('is not found when the search %s', async (_, page) => {
    stubSearch(page)

    const { statusCode } = await get(
      `/organisations/${organisationNumber}/overview`
    )

    expect(statusCode).toBe(statusCodes.notFound)
  })

  it('is not found when the backend refuses the search', async () => {
    mswServer.use(
      http.get(`${backendUrl}/v1/organisations`, () =>
        HttpResponse.json({}, { status: statusCodes.forbidden })
      )
    )

    const { statusCode } = await get(
      `/organisations/${organisationNumber}/overview`
    )

    expect(statusCode).toBe(statusCodes.notFound)
  })

  it('is not found for an old id URL whose organisation the backend does not find', async () => {
    mswServer.use(
      http.get(
        `${backendUrl}/v1/organisations/${organisationId}/overview`,
        () => HttpResponse.json({}, { status: statusCodes.notFound })
      )
    )

    const { statusCode } = await get(
      `/organisations/${organisationId}/registrations/${registrationId}/reports/2026/quarterly/1/submissions/1`
    )

    expect(statusCode).toBe(statusCodes.notFound)
  })

  it('fails when the backend cannot search', async () => {
    mswServer.use(
      http.get(`${backendUrl}/v1/organisations`, () =>
        HttpResponse.json({}, { status: statusCodes.internalServerError })
      )
    )

    const { statusCode } = await get(
      `/organisations/${organisationNumber}/overview`
    )

    expect(statusCode).toBe(statusCodes.internalServerError)
  })
})
