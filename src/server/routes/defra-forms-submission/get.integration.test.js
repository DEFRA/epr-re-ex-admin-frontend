import { vi } from 'vitest'
import { createServer } from '#server/server.js'
import { config } from '#config/config.js'
import { statusCodes } from '#server/common/constants/status-codes.js'
import { mockUserSession } from '#server/common/test-helpers/fixtures.js'
import { getUserSession } from '#server/common/helpers/auth/get-user-session.js'
import { createMockOidcServer } from '#server/common/test-helpers/mock-oidc.js'
import {
  http,
  server as mswServer,
  HttpResponse
} from '../../../../.vite/setup-msw.js'

vi.mock('#server/common/helpers/auth/get-user-session.js', () => ({
  getUserSession: vi.fn().mockReturnValue(null)
}))

describe('GET /defra-forms-submission/{documentId}', () => {
  const backendUrl = config.get('eprBackendUrl')
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
    // Ensure any stubbed globals are reset after each test
    if (typeof vi.unstubAllGlobals === 'function') {
      vi.unstubAllGlobals()
    }
  })

  describe('When user is unauthenticated', () => {
    test('Should return unauthorised status code and unauthorised view', async () => {
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/defra-forms-submission/123'
      })

      expect(statusCode).toBe(statusCodes.unauthorised)
      expect(result).toEqual(expect.stringContaining('Unauthorised'))
    })
  })

  describe('When user is authenticated', () => {
    beforeEach(() => {
      getUserSession.mockReturnValue(mockUserSession)
    })

    test('Should return OK and render defra forms submission details', async () => {
      const documentId = '000000-0000-1234'
      const org1 = { id: 'org-1' }
      const reg1 = { id: 'reg-1' }
      const reg2 = { id: 'reg-2' }
      const acc1 = { id: 'acc-1' }
      const acc2 = { id: 'acc-2' }
      const backendResponse = {
        organisation: org1,
        registrations: [reg1, reg2],
        accreditations: [acc1, acc2]
      }

      const getFormSubmissionsDataHandler = http.get(
        `${backendUrl}/v1/form-submissions/${documentId}`,
        () => {
          return HttpResponse.json(backendResponse)
        }
      )

      mswServer.use(getFormSubmissionsDataHandler)

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: `/defra-forms-submission/${documentId}`,
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        }
      })

      const quotesEscaped = (s) => s.replaceAll('"', '&quot;')

      expect(statusCode).toBe(statusCodes.ok)
      expect(result)
        .toContain('<textarea class="govuk-textarea" id="organisation"')
        .toContain(quotesEscaped('"id": "org-1"'))
        .toContain('<textarea class="govuk-textarea" id="registration-1"')
        .toContain(quotesEscaped('"id": "reg-1"'))
        .toContain('<textarea class="govuk-textarea" id="registration-2"')
        .toContain(quotesEscaped('"id": "reg-2"'))
        .toContain('<textarea class="govuk-textarea" id="accreditation-1"')
        .toContain(quotesEscaped('"id": "acc-1"'))
        .toContain('<textarea class="govuk-textarea" id="accreditation-2"')
        .toContain(quotesEscaped('"id": "acc-2"'))
    })

    test('Should page with no data when backend fetch throws', async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'))

      vi.stubGlobal('fetch', fetchMock)

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/defra-forms-submission/456',
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        }
      })

      expect(statusCode).toBe(statusCodes.ok)
      expect(result)
        .toContain('<h3 class="govuk-heading-m">Organisation</h3>')
        .toContain('No organisations submission data found.')
        .toContain('<h3 class="govuk-heading-m">Registrations</h3>')
        .toContain('No registrations submission data found.')
        .toContain('<h3 class="govuk-heading-m">Accreditations</h3>')
        .toContain('No accreditations submission data found.')
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })
  })
})
