import { vi } from 'vitest'
import { publicRegisterPostController } from './controller.post.js'

vi.mock('#server/common/helpers/fetch-json-from-backend.js', () => ({
  fetchJsonFromBackend: vi.fn()
}))

describe('public-register POST controller', () => {
  let mockRequest
  let mockH
  let fetchJsonFromBackend

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

    mockH = {
      redirect: vi.fn().mockReturnValue('redirect-response')
    }
  })

  test('Should call backend API with correct parameters', async () => {
    const mockResponse = {
      status: 'generated',
      downloadUrl: 'https://s3.example.com/public-register.csv',
      generatedAt: '2026-01-26T14:15:30.123Z',
      expiresAt: '2026-01-26T15:15:30.123Z'
    }

    fetchJsonFromBackend.mockResolvedValue(mockResponse)

    await publicRegisterPostController.handler(mockRequest, mockH)

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      mockRequest,
      '/v1/public-register/generate',
      { method: 'POST' }
    )
  })

  test('Should redirect to downloadUrl on success', async () => {
    const mockDownloadUrl =
      'https://s3.example.com/public-register.csv?signed=abc123'
    const mockResponse = {
      status: 'generated',
      downloadUrl: mockDownloadUrl,
      generatedAt: '2026-01-26T14:15:30.123Z',
      expiresAt: '2026-01-26T15:15:30.123Z'
    }

    fetchJsonFromBackend.mockResolvedValue(mockResponse)

    await publicRegisterPostController.handler(mockRequest, mockH)

    expect(mockH.redirect).toHaveBeenCalledWith(mockDownloadUrl)
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

  test('Should handle error with missing output property', async () => {
    const mockError = { message: 'Some error' }

    fetchJsonFromBackend.mockRejectedValue(mockError)

    await publicRegisterPostController.handler(mockRequest, mockH)

    expect(mockRequest.yar.set).toHaveBeenCalledWith(
      'error',
      'There was a problem generating the public register. Please try again.'
    )
    expect(mockH.redirect).toHaveBeenCalledWith('/public-register')
  })
})
