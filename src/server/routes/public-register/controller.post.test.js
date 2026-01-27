import { vi } from 'vitest'
import { publicRegisterPostController } from './controller.post.js'

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

    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('Should call backend API with correct parameters', async () => {
    const mockDownloadUrl = 'https://s3.example.com/public-register.csv'
    const mockCsvContent = 'csv,content'

    fetchJsonFromBackend.mockResolvedValue({ downloadUrl: mockDownloadUrl })
    fetch.mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(mockCsvContent)
    })

    await publicRegisterPostController.handler(mockRequest, mockH)

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      mockRequest,
      '/v1/public-register/generate',
      { method: 'POST' }
    )
  })

  test('Should fetch file from downloadUrl and return CSV content', async () => {
    const mockDownloadUrl = 'https://s3.example.com/public-register.csv'
    const mockCsvContent = 'csv,content'

    fetchJsonFromBackend.mockResolvedValue({ downloadUrl: mockDownloadUrl })
    fetch.mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(mockCsvContent)
    })

    await publicRegisterPostController.handler(mockRequest, mockH)

    expect(fetch).toHaveBeenCalledWith(mockDownloadUrl)
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

  test('Should set flash error and redirect when file fetch fails', async () => {
    const mockDownloadUrl = 'https://s3.example.com/public-register.csv'

    fetchJsonFromBackend.mockResolvedValue({ downloadUrl: mockDownloadUrl })
    fetch.mockResolvedValue({ ok: false, text: vi.fn() })

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
