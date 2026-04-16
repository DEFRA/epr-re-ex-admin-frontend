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
      http.get(
        presignedUrl,
        () => new HttpResponse(new Uint8Array([0x50, 0x4b]))
      )
    )

    await systemLogDownloadController.handler(mockRequest, mockH)

    expect(fetchRedirectFromBackend).toHaveBeenCalledWith(
      mockRequest,
      '/v1/organisations/org-123/registrations/reg-456/summary-logs/sl-789/file'
    )
  })

  test('streams binary file content from S3 to the browser', async () => {
    const presignedUrl =
      'https://my-bucket.s3.eu-west-2.amazonaws.com/file.xlsx'
    const binaryContent = new Uint8Array([
      0x50, 0x4b, 0x03, 0x04, 0xff, 0xfe, 0x00, 0x80
    ])

    fetchRedirectFromBackend.mockResolvedValue(presignedUrl)
    mswServer.use(http.get(presignedUrl, () => new HttpResponse(binaryContent)))

    await systemLogDownloadController.handler(mockRequest, mockH)

    const responseArg = mockH.response.mock.calls[0][0]
    expect(Buffer.isBuffer(responseArg)).toBe(true)
    expect([...responseArg]).toEqual([...binaryContent])
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
    const binaryContent = new Uint8Array([0x50, 0x4b, 0x03, 0x04])

    fetchRedirectFromBackend.mockResolvedValue(presignedUrl)
    mswServer.use(http.get(presignedUrl, () => new HttpResponse(binaryContent)))

    await systemLogDownloadController.handler(mockRequest, mockH)

    const responseArg = mockH.response.mock.calls[0][0]
    expect(Buffer.isBuffer(responseArg)).toBe(true)
    expect([...responseArg]).toEqual([...binaryContent])
  })

  test('accepts Floci URLs', async () => {
    const presignedUrl = 'http://floci:4566/bucket/file.xlsx'
    const binaryContent = new Uint8Array([0x50, 0x4b, 0x03, 0x04])

    fetchRedirectFromBackend.mockResolvedValue(presignedUrl)
    mswServer.use(http.get(presignedUrl, () => new HttpResponse(binaryContent)))

    await systemLogDownloadController.handler(mockRequest, mockH)

    const responseArg = mockH.response.mock.calls[0][0]
    expect(Buffer.isBuffer(responseArg)).toBe(true)
    expect([...responseArg]).toEqual([...binaryContent])
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
