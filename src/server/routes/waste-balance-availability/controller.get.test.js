import { vi } from 'vitest'
import { wasteBalanceAvailabilityGetController } from './controller.get.js'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

vi.mock('#server/common/helpers/fetch-json-from-backend.js', () => ({
  fetchJsonFromBackend: vi.fn()
}))

describe('waste-balance-availability GET controller', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      route: {
        settings: {
          app: { pageTitle: 'Waste balance availability' }
        }
      },
      yar: {
        get: vi.fn().mockReturnValue(null),
        clear: vi.fn()
      }
    }

    mockH = {
      view: vi.fn().mockReturnValue('rendered-view')
    }
  })

  test('Should fetch balance data from backend and render page', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      generatedAt: '2026-01-29T12:00:00.000Z',
      materials: [
        { material: 'aluminium', availableAmount: 1234.56 },
        { material: 'glass_re_melt', availableAmount: 5678.9 }
      ],
      total: 6913.46
    })

    await wasteBalanceAvailabilityGetController.handler(mockRequest, mockH)

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      mockRequest,
      '/v1/waste-balance-availability'
    )

    expect(mockH.view).toHaveBeenCalledWith(
      'routes/waste-balance-availability/index',
      {
        pageTitle: 'Waste balance availability',
        generatedAt: '2026-01-29T12:00:00.000Z',
        materials: [
          { material: 'Aluminium', availableAmount: '1234.56' },
          { material: 'Glass re-melt', availableAmount: '5678.90' }
        ],
        total: '6913.46',
        error: null
      }
    )
  })

  test('Should format material names to display names', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      generatedAt: '2026-01-29T12:00:00.000Z',
      materials: [
        { material: 'plastic', availableAmount: 100 },
        { material: 'paper', availableAmount: 200 },
        { material: 'glass_other', availableAmount: 300 }
      ],
      total: 600
    })

    await wasteBalanceAvailabilityGetController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith(
      'routes/waste-balance-availability/index',
      expect.objectContaining({
        materials: [
          { material: 'Plastic', availableAmount: '100.00' },
          { material: 'Paper and board', availableAmount: '200.00' },
          { material: 'Glass other', availableAmount: '300.00' }
        ]
      })
    )
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

    await wasteBalanceAvailabilityGetController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith(
      'routes/waste-balance-availability/index',
      expect.objectContaining({
        materials: [
          { material: 'Wood', availableAmount: '1000.00' },
          { material: 'Fibre based composite', availableAmount: '99.10' }
        ],
        total: '1099.10'
      })
    )
  })

  test('Should treat null availableAmount as zero', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      generatedAt: '2026-01-29T12:00:00.000Z',
      materials: [{ material: 'plastic', availableAmount: null }],
      total: null
    })

    await wasteBalanceAvailabilityGetController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith(
      'routes/waste-balance-availability/index',
      expect.objectContaining({
        materials: [{ material: 'Plastic', availableAmount: '0.00' }],
        total: '0.00'
      })
    )
  })

  test('Should throw for unknown material names', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      generatedAt: '2026-01-29T12:00:00.000Z',
      materials: [{ material: 'unknown_material', availableAmount: 100 }],
      total: 100
    })

    await expect(
      wasteBalanceAvailabilityGetController.handler(mockRequest, mockH)
    ).rejects.toThrow('Unknown material: unknown_material')
  })

  test('Should handle empty materials array', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      generatedAt: '2026-01-29T12:00:00.000Z',
      materials: [],
      total: 0
    })

    await wasteBalanceAvailabilityGetController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith(
      'routes/waste-balance-availability/index',
      {
        pageTitle: 'Waste balance availability',
        generatedAt: '2026-01-29T12:00:00.000Z',
        materials: [],
        total: '0.00',
        error: null
      }
    )
  })

  test('Should display error message from session and clear it', async () => {
    mockRequest.yar.get.mockReturnValue('Download failed')

    fetchJsonFromBackend.mockResolvedValue({
      generatedAt: '2026-01-29T12:00:00.000Z',
      materials: [],
      total: 0
    })

    await wasteBalanceAvailabilityGetController.handler(mockRequest, mockH)

    expect(mockRequest.yar.get).toHaveBeenCalledWith('error')
    expect(mockRequest.yar.clear).toHaveBeenCalledWith('error')

    expect(mockH.view).toHaveBeenCalledWith(
      'routes/waste-balance-availability/index',
      expect.objectContaining({
        error: 'Download failed'
      })
    )
  })
})
