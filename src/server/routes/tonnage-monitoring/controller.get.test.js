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
      },
      query: {}
    }

    mockH = {
      view: vi.fn().mockReturnValue('rendered-view')
    }
  })

  test('Should fetch tonnage data and render all materials', async () => {
    const mockMaterials = Array.from({ length: 20 }, (_, i) => ({
      material: 'aluminium',
      year: 2026,
      type: 'Exporter',
      months: [
        { month: 'Jan', tonnage: 100 + i },
        { month: 'Feb', tonnage: 0 }
      ]
    }))

    fetchJsonFromBackend.mockResolvedValue({
      generatedAt: '2026-01-29T12:00:00.000Z',
      materials: mockMaterials,
      total: 2190
    })

    await tonnageMonitoringGetController.handler(mockRequest, mockH)

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      mockRequest,
      '/v1/tonnage-monitoring'
    )

    const viewCall = mockH.view.mock.calls[0]
    expect(viewCall[0]).toBe('routes/tonnage-monitoring/index')
    expect(viewCall[1].pageTitle).toBe('Tonnage monitoring')
    expect(viewCall[1].generatedAt).toBe('2026-01-29T12:00:00.000Z')
    expect(viewCall[1].materials).toHaveLength(20) // All items
    expect(viewCall[1].materials[0]).toEqual({
      material: 'Aluminium',
      type: 'Exporter',
      Jan: '100.00',
      Feb: '0.00'
    })
    expect(viewCall[1].monthNames).toEqual(['Jan', 'Feb'])
    expect(viewCall[1].hasMultipleYears).toBe(false)
    expect(viewCall[1].total).toBe('2190.00')
    expect(viewCall[1].error).toBe(null)
  })

  test('Should format material names and types correctly', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      generatedAt: '2026-01-29T12:00:00.000Z',
      materials: [
        {
          material: 'glass_re_melt',
          year: 2026,
          type: 'Exporter',
          months: [{ month: 'Jan', tonnage: 100 }]
        },
        {
          material: 'glass_other',
          year: 2026,
          type: 'Reprocessor',
          months: [{ month: 'Jan', tonnage: 200 }]
        },
        {
          material: 'paper',
          year: 2026,
          type: 'Exporter',
          months: [{ month: 'Jan', tonnage: 300 }]
        }
      ],
      total: 600
    })

    await tonnageMonitoringGetController.handler(mockRequest, mockH)

    const viewCall = mockH.view.mock.calls[0]
    expect(viewCall[1].materials).toEqual([
      {
        material: 'Glass re-melt',
        type: 'Exporter',
        Jan: '100.00'
      },
      {
        material: 'Glass other',
        type: 'Reprocessor',
        Jan: '200.00'
      },
      {
        material: 'Paper and board',
        type: 'Exporter',
        Jan: '300.00'
      }
    ])
  })

  test('Should format tonnage values to 2 decimal places', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      generatedAt: '2026-01-29T12:00:00.000Z',
      materials: [
        {
          material: 'aluminium',
          year: 2026,
          type: 'Exporter',
          months: [{ month: 'Jan', tonnage: 100 }]
        },
        {
          material: 'aluminium',
          year: 2026,
          type: 'Reprocessor',
          months: [{ month: 'Jan', tonnage: 50 }]
        },
        {
          material: 'steel',
          year: 2026,
          type: 'Exporter',
          months: [{ month: 'Jan', tonnage: 25.5 }]
        }
      ],
      total: 175.5
    })

    await tonnageMonitoringGetController.handler(mockRequest, mockH)

    const viewCall = mockH.view.mock.calls[0]
    expect(viewCall[1].materials[0].Jan).toBe('100.00')
    expect(viewCall[1].materials[1].Jan).toBe('50.00')
    expect(viewCall[1].materials[2].Jan).toBe('25.50')
    expect(viewCall[1].total).toBe('175.50')
  })

  test('Should handle empty materials array', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      generatedAt: '2026-01-29T12:00:00.000Z',
      materials: [],
      total: 0
    })

    await tonnageMonitoringGetController.handler(mockRequest, mockH)

    const viewCall = mockH.view.mock.calls[0]
    expect(viewCall[1]).toEqual({
      pageTitle: 'Tonnage monitoring',
      generatedAt: '2026-01-29T12:00:00.000Z',
      materials: [],
      monthNames: [],
      hasMultipleYears: false,
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

    const viewCall = mockH.view.mock.calls[0]
    expect(viewCall[1].error).toBe('Download failed')
  })

  test('Should throw error for unknown material', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      generatedAt: '2026-01-29T12:00:00.000Z',
      materials: [
        {
          material: 'unknown_material',
          year: 2026,
          type: 'Exporter',
          months: [{ month: 'Jan', tonnage: 100 }]
        }
      ],
      total: 100
    })

    await expect(
      tonnageMonitoringGetController.handler(mockRequest, mockH)
    ).rejects.toThrow('Unknown material: unknown_material')
  })

  test('Should include year column when multiple years are present', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      generatedAt: '2026-01-29T12:00:00.000Z',
      materials: [
        {
          material: 'plastic',
          year: 2025,
          type: 'Exporter',
          months: [{ month: 'Dec', tonnage: 100 }]
        },
        {
          material: 'plastic',
          year: 2026,
          type: 'Exporter',
          months: [{ month: 'Dec', tonnage: 150 }]
        }
      ],
      total: 250
    })

    await tonnageMonitoringGetController.handler(mockRequest, mockH)

    const viewCall = mockH.view.mock.calls[0]
    expect(viewCall[1].hasMultipleYears).toBe(true)
    expect(viewCall[1].materials[0]).toEqual({
      material: 'Plastic',
      type: 'Exporter',
      year: 2025,
      Dec: '100.00'
    })
    expect(viewCall[1].materials[1]).toEqual({
      material: 'Plastic',
      type: 'Exporter',
      year: 2026,
      Dec: '150.00'
    })
  })

  test('Should handle materials with different month counts', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      generatedAt: '2026-01-29T12:00:00.000Z',
      materials: [
        {
          material: 'plastic',
          year: 2026,
          type: 'Exporter',
          months: [
            { month: 'Jan', tonnage: 100 },
            { month: 'Feb', tonnage: 150 },
            { month: 'Mar', tonnage: 200 }
          ]
        },
        {
          material: 'aluminium',
          year: 2026,
          type: 'Exporter',
          months: [{ month: 'Jan', tonnage: 50 }]
        }
      ],
      total: 500
    })

    await tonnageMonitoringGetController.handler(mockRequest, mockH)

    const viewCall = mockH.view.mock.calls[0]
    expect(viewCall[1].monthNames).toEqual(['Jan', 'Feb', 'Mar'])
    expect(viewCall[1].materials[0]).toEqual({
      material: 'Plastic',
      type: 'Exporter',
      Jan: '100.00',
      Feb: '150.00',
      Mar: '200.00'
    })
    expect(viewCall[1].materials[1]).toEqual({
      material: 'Aluminium',
      type: 'Exporter',
      Jan: '50.00',
      Feb: '',
      Mar: ''
    })
  })
})
