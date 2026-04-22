import { vi } from 'vitest'
import { publicRegisterPostController } from './controller.post.js'
import { http, server as mswServer, HttpResponse } from '#vite/setup-msw.js'

vi.mock('#server/common/helpers/fetch-json-from-backend.js', () => ({
  fetchJsonFromBackend: vi.fn()
}))

describe('public-register POST controller', () => {
  let mockRequest
  let mockH
  let fetchJsonFromBackend
  let mockResponseChain

  beforeEach(async () => {
    const module =
      await import('#server/common/helpers/fetch-json-from-backend.js')
    fetchJsonFromBackend = module.fetchJsonFromBackend
    vi.clearAllMocks()

    mockRequest = {
      yar: {
        set: vi.fn()
      }
    }

    mockResponseChain = {
      header: vi.fn().mockReturnThis()
    }

    mockH = {
      redirect: vi.fn().mockReturnValue('redirect-response'),
      response: vi.fn().mockReturnValue(mockResponseChain)
    }
  })

  test('Should call backend API with correct parameters', async () => {
    const mockDownloadUrl =
      'https://my-bucket.s3.eu-west-2.amazonaws.com/public-register.csv'
    const mockCsvContent = 'csv,content'

    fetchJsonFromBackend.mockResolvedValue({ downloadUrl: mockDownloadUrl })
    mswServer.use(
      http.get(mockDownloadUrl, () => new HttpResponse(mockCsvContent))
    )

    await publicRegisterPostController.handler(mockRequest, mockH)

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      mockRequest,
      '/v1/public-register/generate',
      { method: 'POST' }
    )
  })

  test('Should fetch file from downloadUrl and return CSV content', async () => {
    const mockDownloadUrl =
      'https://my-bucket.s3.eu-west-2.amazonaws.com/public-register.csv'
    const mockCsvContent = 'csv,content'

    fetchJsonFromBackend.mockResolvedValue({ downloadUrl: mockDownloadUrl })
    mswServer.use(
      http.get(mockDownloadUrl, () => new HttpResponse(mockCsvContent))
    )

    await publicRegisterPostController.handler(mockRequest, mockH)

    expect(mockH.response).toHaveBeenCalledWith(mockCsvContent)
    expect(mockResponseChain.header).toHaveBeenCalledWith(
      'Content-Type',
      'text/csv'
    )
    expect(mockResponseChain.header).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="public-register.csv"'
    )
  })

  test('Should accept localhost URLs', async () => {
    const mockDownloadUrl = 'http://localhost:4566/bucket/public-register.csv'
    const mockCsvContent = 'csv,content'

    fetchJsonFromBackend.mockResolvedValue({ downloadUrl: mockDownloadUrl })
    mswServer.use(
      http.get(mockDownloadUrl, () => new HttpResponse(mockCsvContent))
    )

    await publicRegisterPostController.handler(mockRequest, mockH)

    expect(mockH.response).toHaveBeenCalledWith(mockCsvContent)
  })

  test('Should accept Floci URLs with Docker hostname', async () => {
    const mockDownloadUrl =
      'http://floci:4566/bucket/public-register.csv?signed=abc'
    const mockCsvContent = 'csv,content'

    fetchJsonFromBackend.mockResolvedValue({ downloadUrl: mockDownloadUrl })
    mswServer.use(
      http.get(
        'http://floci:4566/bucket/public-register.csv',
        () => new HttpResponse(mockCsvContent)
      )
    )

    await publicRegisterPostController.handler(mockRequest, mockH)

    expect(mockH.response).toHaveBeenCalledWith(mockCsvContent)
  })

  test('Should reject invalid download URLs to prevent SSRF', async () => {
    const maliciousUrl = 'https://evil-site.com/steal-data'

    fetchJsonFromBackend.mockResolvedValue({ downloadUrl: maliciousUrl })

    await publicRegisterPostController.handler(mockRequest, mockH)

    expect(mockRequest.yar.set).toHaveBeenCalledWith(
      'error',
      'There was a problem generating the public register. Please try again.'
    )
    expect(mockH.redirect).toHaveBeenCalledWith('/public-register')
  })

  test('Should set flash error and redirect when file fetch fails', async () => {
    const mockDownloadUrl =
      'https://my-bucket.s3.eu-west-2.amazonaws.com/public-register.csv'

    fetchJsonFromBackend.mockResolvedValue({ downloadUrl: mockDownloadUrl })
    mswServer.use(
      http.get(mockDownloadUrl, () => new HttpResponse(null, { status: 500 }))
    )

    await publicRegisterPostController.handler(mockRequest, mockH)

    expect(mockRequest.yar.set).toHaveBeenCalledWith(
      'error',
      'There was a problem generating the public register. Please try again.'
    )
    expect(mockH.redirect).toHaveBeenCalledWith('/public-register')
  })

  test('Should set flash error and redirect on backend failure with message', async () => {
    const mockError = {
      output: {
        payload: { message: 'Backend error occurred' }
      }
    }

    fetchJsonFromBackend.mockRejectedValue(mockError)

    await publicRegisterPostController.handler(mockRequest, mockH)

    expect(mockRequest.yar.set).toHaveBeenCalledWith(
      'error',
      'Backend error occurred'
    )
    expect(mockH.redirect).toHaveBeenCalledWith('/public-register')
  })

  test('Should use default error message when backend provides none', async () => {
    fetchJsonFromBackend.mockRejectedValue(new Error('Network error'))

    await publicRegisterPostController.handler(mockRequest, mockH)

    expect(mockRequest.yar.set).toHaveBeenCalledWith(
      'error',
      'There was a problem generating the public register. Please try again.'
    )
    expect(mockH.redirect).toHaveBeenCalledWith('/public-register')
  })
})
