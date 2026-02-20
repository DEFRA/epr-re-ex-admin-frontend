import { vi } from 'vitest'
import { wasteBalanceAvailabilityPostController } from './controller.post.js'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

vi.mock('#server/common/helpers/fetch-json-from-backend.js', () => ({
  fetchJsonFromBackend: vi.fn()
}))

describe('waste-balance-availability POST controller', () => {
  let mockRequest
  let mockH
  let mockResponse

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      yar: {
        set: vi.fn()
      }
    }

    mockResponse = {
      header: vi.fn().mockReturnThis()
    }

    mockH = {
      response: vi.fn().mockReturnValue(mockResponse),
      redirect: vi.fn().mockReturnValue('redirect-response')
    }
  })

  test('Should generate CSV with correct headers and formatting', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      generatedAt: '2026-01-29T14:30:00.000Z',
      materials: [
        { material: 'aluminium', availableAmount: 1234.56 },
        { material: 'glass_re_melt', availableAmount: 5678.9 }
      ],
      total: 6913.46
    })

    await wasteBalanceAvailabilityPostController.handler(mockRequest, mockH)

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      mockRequest,
      '/v1/waste-balance-availability'
    )

    const expectedCsv = [
      '"Waste balance availability by material"',
      '',
      '"Available waste balance by material, after PRN and sent-on deductions."',
      '',
      '"Data generated at: 29 January 2026 at 2:30pm"',
      '',
      '"Material","Available amount"',
      '"Aluminium","1234.56"',
      '"Glass re-melt","5678.90"',
      '"Total","6913.46"'
    ].join('\n')

    expect(mockH.response).toHaveBeenCalledWith(expectedCsv)
    expect(mockResponse.header).toHaveBeenCalledWith('Content-Type', 'text/csv')
    expect(mockResponse.header).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="waste-balance-availability.csv"'
    )
  })

  test('Should format material names to display names', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      generatedAt: '2026-01-29T09:00:00.000Z',
      materials: [
        { material: 'plastic', availableAmount: 100 },
        { material: 'paper', availableAmount: 200 }
      ],
      total: 300
    })

    await wasteBalanceAvailabilityPostController.handler(mockRequest, mockH)

    const csvContent = mockH.response.mock.calls[0][0]
    expect(csvContent).toContain('"Plastic","100.00"')
    expect(csvContent).toContain('"Paper and board","200.00"')
  })

  test('Should format amount values to 2 decimal places', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      generatedAt: '2026-01-29T12:00:00.000Z',
      materials: [
        { material: 'wood', availableAmount: 1000 },
        { material: 'fibre', availableAmount: 99.1 }
      ],
      total: 1099.1
    })

    await wasteBalanceAvailabilityPostController.handler(mockRequest, mockH)

    const csvContent = mockH.response.mock.calls[0][0]
    expect(csvContent).toContain('"Wood","1000.00"')
    expect(csvContent).toContain('"Fibre based composite","99.10"')
    expect(csvContent).toContain('"Total","1099.10"')
  })

  test('Should format morning times correctly', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      generatedAt: '2026-06-15T09:05:00.000Z',
      materials: [],
      total: 0
    })

    await wasteBalanceAvailabilityPostController.handler(mockRequest, mockH)

    const csvContent = mockH.response.mock.calls[0][0]
    expect(csvContent).toContain('Data generated at: 15 June 2026 at')
  })

  test('Should handle empty materials array', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      generatedAt: '2026-01-29T12:00:00.000Z',
      materials: [],
      total: 0
    })

    await wasteBalanceAvailabilityPostController.handler(mockRequest, mockH)

    const expectedCsv = [
      '"Waste balance availability by material"',
      '',
      '"Available waste balance by material, after PRN and sent-on deductions."',
      '',
      '"Data generated at: 29 January 2026 at 12:00pm"',
      '',
      '"Material","Available amount"',
      '"Total","0.00"'
    ].join('\n')

    expect(mockH.response).toHaveBeenCalledWith(expectedCsv)
  })

  test('Should redirect with error message on fetch failure', async () => {
    fetchJsonFromBackend.mockRejectedValue(new Error('Network error'))

    const result = await wasteBalanceAvailabilityPostController.handler(
      mockRequest,
      mockH
    )

    expect(mockRequest.yar.set).toHaveBeenCalledWith(
      'error',
      'There was a problem downloading the waste balance data. Please try again.'
    )
    expect(mockH.redirect).toHaveBeenCalledWith('/waste-balance-availability')
    expect(result).toBe('redirect-response')
  })

  test('Should use error message from backend when available', async () => {
    const error = new Error('Backend error')
    error.output = { payload: { message: 'Custom backend error message' } }
    fetchJsonFromBackend.mockRejectedValue(error)

    await wasteBalanceAvailabilityPostController.handler(mockRequest, mockH)

    expect(mockRequest.yar.set).toHaveBeenCalledWith(
      'error',
      'Custom backend error message'
    )
  })
})
