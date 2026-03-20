import { vi } from 'vitest'
import { systemLogDownloadController } from './controller.download.js'
import { fetchRedirectFromBackend } from '#server/common/helpers/fetch-redirect-from-backend.js'

vi.mock('#server/common/helpers/fetch-redirect-from-backend.js', () => ({
  fetchRedirectFromBackend: vi.fn()
}))

describe('system-log download controller', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      params: {
        organisationId: 'org-123',
        registrationId: 'reg-456',
        summaryLogId: 'sl-789'
      }
    }

    mockH = {
      redirect: vi.fn().mockReturnValue({
        temporary: vi.fn().mockReturnValue('redirect-response')
      })
    }
  })

  test('calls the backend download endpoint with correct path', async () => {
    fetchRedirectFromBackend.mockResolvedValue(
      'https://s3.amazonaws.com/bucket/file.xlsx?signed=abc'
    )

    await systemLogDownloadController.handler(mockRequest, mockH)

    expect(fetchRedirectFromBackend).toHaveBeenCalledWith(
      mockRequest,
      '/v1/organisations/org-123/registrations/reg-456/summary-logs/sl-789/download'
    )
  })

  test('redirects to the pre-signed URL from the backend', async () => {
    const presignedUrl = 'https://s3.amazonaws.com/bucket/file.xlsx?signed=abc'
    fetchRedirectFromBackend.mockResolvedValue(presignedUrl)

    const result = await systemLogDownloadController.handler(mockRequest, mockH)

    expect(mockH.redirect).toHaveBeenCalledWith(presignedUrl)
    expect(mockH.redirect(presignedUrl).temporary).toHaveBeenCalled()
    expect(result).toBe('redirect-response')
  })
})
