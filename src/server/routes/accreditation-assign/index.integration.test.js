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

describe('accreditation-assign', () => {
  const backendUrl = config.get('eprBackendUrl')
  const organisationId = 'aaa111bbb222ccc333ddd4444'
  const accreditationId = 'ccc333ddd444eee555fff6666'
  const registrationId = 'bbb222ccc333ddd444eee5555'

  const overviewUrl = `/organisations/${organisationId}/overview`
  const confirmUrl = `/organisations/${organisationId}/accreditations/${accreditationId}/assign/confirm`
  const postUrl = `/organisations/${organisationId}/accreditations/${accreditationId}/assign`
  const assignEndpoint = `${backendUrl}/v1/organisations/${organisationId}/accreditations/${accreditationId}/registration`

  const readOnlySession = { ...mockUserSession, scopes: ['admin.read'] }
  const writeAuth = { strategy: 'session', credentials: mockUserSession }
  const readAuth = { strategy: 'session', credentials: readOnlySession }

  const unlinkedAccreditation = {
    id: accreditationId,
    accreditationNumber: null,
    status: 'created',
    material: 'glass',
    processingType: 'reprocessor',
    site: 'Site A'
  }

  const candidate = {
    id: registrationId,
    registrationNumber: 'REG-50030-001',
    status: 'approved',
    material: 'glass',
    processingType: 'reprocessor',
    site: 'Site A',
    reprocessingType: 'input'
  }

  const nonCandidate = {
    id: 'ddd444eee555fff666aaa7777',
    registrationNumber: 'REG-50030-002',
    status: 'approved',
    material: 'plastic',
    processingType: 'reprocessor',
    site: 'Site A',
    reprocessingType: 'output'
  }

  const overviewWith = (registrations) => ({
    id: organisationId,
    companyName: 'ACME Ltd',
    registrations,
    unlinkedAccreditations: [unlinkedAccreditation]
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

  const stubOverview = (overview) =>
    mswServer.use(
      http.get(
        `${backendUrl}/v1/organisations/${organisationId}/overview`,
        () => HttpResponse.json(overview)
      )
    )

  const stubAssign = (respond) =>
    mswServer.use(http.post(assignEndpoint, respond))

  const postAssign = async (payload) => {
    const { cookie, crumb } = await getCsrfToken(server, confirmUrl, writeAuth)
    const postResponse = await server.inject({
      method: 'POST',
      url: postUrl,
      auth: writeAuth,
      headers: { cookie },
      payload: { crumb, ...payload }
    })
    const postCookies = [postResponse.headers['set-cookie']]
      .flat()
      .filter(Boolean)
    const redirectCookie = postCookies.length
      ? postCookies.map((c) => c.split(';')[0]).join('; ')
      : cookie
    return { postResponse, redirectCookie }
  }

  describe('the assign form', () => {
    test('is rejected with 401 when unauthenticated', async () => {
      const { statusCode } = await server.inject({
        method: 'GET',
        url: confirmUrl
      })

      expect(statusCode).toBe(statusCodes.unauthorised)
    })

    test('returns 403 for a read-only admin', async () => {
      vi.mocked(getUserSession).mockResolvedValue(readOnlySession)

      const { statusCode } = await server.inject({
        method: 'GET',
        url: confirmUrl,
        auth: readAuth
      })

      expect(statusCode).toBe(statusCodes.forbidden)
    })

    test('lists only the registrations the accreditation can be assigned to', async () => {
      vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
      stubOverview(overviewWith([candidate, nonCandidate]))

      const { statusCode, result } = await server.inject({
        method: 'GET',
        url: confirmUrl,
        auth: writeAuth
      })

      expect(statusCode).toBe(statusCodes.ok)
      const $ = cheerio.load(result)
      const options = $('#registrationId option')
      expect(options).toHaveLength(2)
      expect($(options[0]).attr('value')).toBe('')
      expect($(options[1]).attr('value')).toBe(registrationId)
      expect($(options[1]).text()).toBe('REG-50030-001 - glass - input')
      expect($('form').attr('action')).toBe(postUrl)
    })

    test('explains there is nothing to assign to, with no select and no submit, when no registration qualifies', async () => {
      vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
      stubOverview(overviewWith([nonCandidate]))

      const { statusCode, result } = await server.inject({
        method: 'GET',
        url: confirmUrl,
        auth: writeAuth
      })

      expect(statusCode).toBe(statusCodes.ok)
      const $ = cheerio.load(result)
      expect($('select')).toHaveLength(0)
      expect($('form')).toHaveLength(0)
      expect($('button:contains("Assign to registration")')).toHaveLength(0)
      expect(result).toContain(
        'There are no registrations this accreditation can be assigned to'
      )
    })

    test('is not found when the accreditation is not an unlinked one', async () => {
      vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
      stubOverview({
        id: organisationId,
        companyName: 'ACME Ltd',
        registrations: [candidate]
      })

      const { statusCode } = await server.inject({
        method: 'GET',
        url: confirmUrl,
        auth: writeAuth
      })

      expect(statusCode).toBe(statusCodes.notFound)
    })
  })

  describe('submitting the assign form', () => {
    test('is rejected with 401 when unauthenticated', async () => {
      const { statusCode } = await server.inject({
        method: 'POST',
        url: postUrl
      })

      expect(statusCode).toBe(statusCodes.unauthorised)
    })

    test('returns 403 for a read-only admin', async () => {
      vi.mocked(getUserSession).mockResolvedValue(readOnlySession)

      const { statusCode } = await server.inject({
        method: 'POST',
        url: postUrl,
        auth: readAuth
      })

      expect(statusCode).toBe(statusCodes.forbidden)
    })

    test('re-renders with an error linked to the field when no registration is chosen', async () => {
      vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
      stubOverview(overviewWith([candidate]))

      const { postResponse } = await postAssign({ registrationId: '' })

      expect(postResponse.statusCode).toBe(statusCodes.badRequest)
      const $ = cheerio.load(postResponse.result)
      const errorLink = $('.govuk-error-summary a')
      expect(errorLink.text()).toBe('Select a registration')
      expect(errorLink.attr('href')).toBe('#registrationId')
      expect($('#registrationId option')).toHaveLength(2)
    })

    test('re-renders with an error when the field is missing from the submission', async () => {
      vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
      stubOverview(overviewWith([candidate]))

      const { postResponse } = await postAssign({})

      expect(postResponse.statusCode).toBe(statusCodes.badRequest)
      expect(postResponse.result).toContain('Select a registration')
    })

    test('posts the chosen registration to the backend and redirects to the organisation overview', async () => {
      vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
      stubOverview(overviewWith([candidate]))

      let assignBody
      stubAssign(async ({ request }) => {
        assignBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      })

      const { postResponse } = await postAssign({ registrationId })

      expect(assignBody).toEqual({ registrationId })
      expect(postResponse.statusCode).toBe(statusCodes.found)
      expect(postResponse.headers.location).toBe(overviewUrl)
    })

    test('re-renders with the backend message when the backend rejects the assignment', async () => {
      vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
      stubOverview(overviewWith([candidate]))
      stubAssign(() =>
        HttpResponse.json(
          { message: 'Registration already has an accreditation' },
          { status: 409 }
        )
      )

      const { postResponse } = await postAssign({ registrationId })

      expect(postResponse.statusCode).toBe(statusCodes.badRequest)
      const $ = cheerio.load(postResponse.result)
      expect($('.govuk-error-summary').text()).toContain(
        'Registration already has an accreditation'
      )
      expect(
        $(`#registrationId option[value="${registrationId}"]`).attr('selected')
      ).toBeDefined()
    })

    test('flashes on the organisation overview when the backend fails', async () => {
      vi.mocked(getUserSession).mockResolvedValue(mockUserSession)
      stubOverview(overviewWith([candidate]))
      stubAssign(() => new HttpResponse(null, { status: 500 }))

      const { postResponse, redirectCookie } = await postAssign({
        registrationId
      })

      expect(postResponse.statusCode).toBe(statusCodes.found)
      expect(postResponse.headers.location).toBe(overviewUrl)

      stubOverview(overviewWith([candidate]))
      const { result } = await server.inject({
        method: 'GET',
        url: overviewUrl,
        headers: { cookie: redirectCookie },
        auth: writeAuth
      })

      expect(cheerio.load(result)('.govuk-error-summary').text()).toContain(
        'There was a problem assigning the accreditation to the registration'
      )
    })
  })
})
