import { vi } from 'vitest'
import { tonnageMonitoringGetController } from './controller.get.js'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

vi.mock('#server/common/helpers/fetch-json-from-backend.js', () => ({
  fetchJsonFromBackend: vi.fn()
}))

describe('tonnage-monitoring GET controller', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      route: {
        settings: {
          app: { pageTitle: 'Tonnage monitoring' }
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

  test('Should fetch tonnage data from backend and render page', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      generatedAt: '2026-01-29T12:00:00.000Z',
      materials: [
        { material: 'aluminium', totalTonnage: 1234.56 },
        { material: 'glass_re_melt', totalTonnage: 5678.9 }
      ],
      total: 6913.46
    })

    await tonnageMonitoringGetController.handler(mockRequest, mockH)

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      mockRequest,
      '/v1/tonnage-monitoring'
    )

    expect(mockH.view).toHaveBeenCalledWith('routes/tonnage-monitoring/index', {
      pageTitle: 'Tonnage monitoring',
      generatedAt: '2026-01-29T12:00:00.000Z',
      materials: [
        { material: 'Aluminium', totalTonnage: '1234.56' },
        { material: 'Glass re-melt', totalTonnage: '5678.90' }
      ],
      total: '6913.46',
      error: null
    })
  })

  test('Should format material names to display names', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      generatedAt: '2026-01-29T12:00:00.000Z',
      materials: [
        { material: 'plastic', totalTonnage: 100 },
        { material: 'paper', totalTonnage: 200 },
        { material: 'glass_other', totalTonnage: 300 }
      ],
      total: 600
    })

    await tonnageMonitoringGetController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith(
      'routes/tonnage-monitoring/index',
      expect.objectContaining({
        materials: [
          { material: 'Plastic', totalTonnage: '100.00' },
          { material: 'Paper and board', totalTonnage: '200.00' },
          { material: 'Glass other', totalTonnage: '300.00' }
        ]
      })
    )
  })

  test('Should format tonnage values to 2 decimal places', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      generatedAt: '2026-01-29T12:00:00.000Z',
      materials: [
        { material: 'wood', totalTonnage: 1000 },
        { material: 'fibre', totalTonnage: 99.1 }
      ],
      total: 1099.1
    })

    await tonnageMonitoringGetController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith(
      'routes/tonnage-monitoring/index',
      expect.objectContaining({
        materials: [
          { material: 'Wood', totalTonnage: '1000.00' },
          { material: 'Fibre based composite', totalTonnage: '99.10' }
        ],
        total: '1099.10'
      })
    )
  })

  test('Should throw for unknown material names', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      generatedAt: '2026-01-29T12:00:00.000Z',
      materials: [{ material: 'unknown_material', totalTonnage: 100 }],
      total: 100
    })

    await expect(
      tonnageMonitoringGetController.handler(mockRequest, mockH)
    ).rejects.toThrow('Unknown material: unknown_material')
  })

  test('Should handle empty materials array', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      generatedAt: '2026-01-29T12:00:00.000Z',
      materials: [],
      total: 0
    })

    await tonnageMonitoringGetController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith('routes/tonnage-monitoring/index', {
      pageTitle: 'Tonnage monitoring',
      generatedAt: '2026-01-29T12:00:00.000Z',
      materials: [],
      total: '0.00',
      error: null
    })
  })

  test('Should display error message from session and clear it', async () => {
    mockRequest.yar.get.mockReturnValue('Download failed')

    fetchJsonFromBackend.mockResolvedValue({
      generatedAt: '2026-01-29T12:00:00.000Z',
      materials: [],
      total: 0
    })

    await tonnageMonitoringGetController.handler(mockRequest, mockH)

    expect(mockRequest.yar.get).toHaveBeenCalledWith('error')
    expect(mockRequest.yar.clear).toHaveBeenCalledWith('error')

    expect(mockH.view).toHaveBeenCalledWith(
      'routes/tonnage-monitoring/index',
      expect.objectContaining({
        error: 'Download failed'
      })
    )
  })
})
