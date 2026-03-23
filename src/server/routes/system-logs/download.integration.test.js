import { vi } from 'vitest'
import { createServer } from '#server/server.js'
import { config } from '#config/config.js'
import { statusCodes } from '#server/common/constants/status-codes.js'
import { mockUserSession } from '#server/common/test-helpers/fixtures.js'
import { getUserSession } from '#server/common/helpers/auth/get-user-session.js'
import { createMockOidcServer } from '#server/common/test-helpers/mock-oidc.js'
import { http, server as mswServer, HttpResponse } from '#vite/setup-msw.js'

vi.mock('#server/common/helpers/auth/get-user-session.js', () => ({
  getUserSession: vi.fn().mockReturnValue(null)
}))

describe('GET /system-logs/download/{organisationId}/{registrationId}/{summaryLogId}', () => {
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

  const downloadUrl = '/system-logs/download/org-123/reg-456/sl-789'

  const backendDownloadPath = `${config.get('eprBackendUrl')}/v1/organisations/org-123/registrations/reg-456/summary-logs/sl-789/file`

  describe('when user is unauthenticated', () => {
    test('returns unauthorised status code', async () => {
      const { statusCode } = await server.inject({
        method: 'GET',
        url: downloadUrl
      })

      expect(statusCode).toBe(statusCodes.unauthorised)
    })
  })

  describe('when user is authenticated', () => {
    beforeEach(() => {
      getUserSession.mockReturnValue(mockUserSession)
    })

    test('streams binary file content from S3 via the backend pre-signed URL', async () => {
      const presignedUrl =
        'https://my-bucket.s3.eu-west-2.amazonaws.com/file.xlsx?X-Amz-Signature=abc123'
      const binaryContent = new Uint8Array([
        0x50, 0x4b, 0x03, 0x04, 0xff, 0xfe, 0x00, 0x80
      ])

      mswServer.use(
        http.get(
          backendDownloadPath,
          () =>
            new HttpResponse(null, {
              status: 302,
              headers: { Location: presignedUrl }
            })
        ),
        http.get(
          'https://my-bucket.s3.eu-west-2.amazonaws.com/file.xlsx',
          () => new HttpResponse(binaryContent)
        )
      )

      const { statusCode, headers, rawPayload } = await server.inject({
        method: 'GET',
        url: downloadUrl,
        auth: {
          strategy: 'session',
          credentials: mockUserSession
        }
      })

      expect(statusCode).toBe(statusCodes.ok)
      expect(headers['content-type']).toBe('application/octet-stream')
      expect(headers['content-disposition']).toBe(
        'attachment; filename="sl-789.xlsx"'
      )
      expect([...rawPayload]).toEqual([...binaryContent])
    })
  })
})
