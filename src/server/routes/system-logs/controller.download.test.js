import { vi } from 'vitest'
import { systemLogDownloadController } from './controller.download.js'
import { fetchRedirectFromBackend } from '#server/common/helpers/fetch-redirect-from-backend.js'
import { http, server as mswServer, HttpResponse } from '#vite/setup-msw.js'

vi.mock('#server/common/helpers/fetch-redirect-from-backend.js', () => ({
  fetchRedirectFromBackend: vi.fn()
}))

describe('system-log download controller', () => {
  let mockRequest
  let mockH
  let mockResponseChain

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      params: {
        organisationId: 'org-123',
        registrationId: 'reg-456',
        summaryLogId: 'sl-789'
      }
    }

    mockResponseChain = {
      header: vi.fn().mockReturnThis()
    }

    mockH = {
      response: vi.fn().mockReturnValue(mockResponseChain)
    }
  })

  test('calls the backend download endpoint with correct path', async () => {
    const presignedUrl =
      'https://my-bucket.s3.eu-west-2.amazonaws.com/file.xlsx'

    fetchRedirectFromBackend.mockResolvedValue(presignedUrl)
    mswServer.use(
      http.get(presignedUrl, () => new HttpResponse('file-content'))
    )

    await systemLogDownloadController.handler(mockRequest, mockH)

    expect(fetchRedirectFromBackend).toHaveBeenCalledWith(
      mockRequest,
      '/v1/organisations/org-123/registrations/reg-456/summary-logs/sl-789/download'
    )
  })

  test('streams file content from S3 to the browser', async () => {
    const presignedUrl =
      'https://my-bucket.s3.eu-west-2.amazonaws.com/file.xlsx'
    const fileContent = 'spreadsheet-binary-content'

    fetchRedirectFromBackend.mockResolvedValue(presignedUrl)
    mswServer.use(http.get(presignedUrl, () => new HttpResponse(fileContent)))

    await systemLogDownloadController.handler(mockRequest, mockH)

    expect(mockH.response).toHaveBeenCalledWith(fileContent)
    expect(mockResponseChain.header).toHaveBeenCalledWith(
      'Content-Type',
      'application/octet-stream'
    )
    expect(mockResponseChain.header).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="sl-789.xlsx"'
    )
  })

  test('accepts LocalStack URLs', async () => {
    const presignedUrl = 'http://localhost:4566/bucket/file.xlsx'

    fetchRedirectFromBackend.mockResolvedValue(presignedUrl)
    mswServer.use(
      http.get(presignedUrl, () => new HttpResponse('file-content'))
    )

    await systemLogDownloadController.handler(mockRequest, mockH)

    expect(mockH.response).toHaveBeenCalledWith('file-content')
  })

  test('rejects invalid download URLs to prevent SSRF', async () => {
    fetchRedirectFromBackend.mockResolvedValue(
      'https://evil-site.com/steal-data'
    )

    await expect(
      systemLogDownloadController.handler(mockRequest, mockH)
    ).rejects.toThrow('Invalid download URL')
  })

  test('throws when file fetch from S3 fails', async () => {
    const presignedUrl =
      'https://my-bucket.s3.eu-west-2.amazonaws.com/file.xlsx'

    fetchRedirectFromBackend.mockResolvedValue(presignedUrl)
    mswServer.use(
      http.get(presignedUrl, () => new HttpResponse(null, { status: 500 }))
    )

    await expect(
      systemLogDownloadController.handler(mockRequest, mockH)
    ).rejects.toThrow('Failed to fetch file from storage')
  })
})
