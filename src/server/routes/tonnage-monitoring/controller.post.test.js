import { vi } from 'vitest'
import { tonnageMonitoringPostController } from './controller.post.js'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

vi.mock('#server/common/helpers/fetch-json-from-backend.js', () => ({
  fetchJsonFromBackend: vi.fn()
}))

describe('tonnage-monitoring POST controller', () => {
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
        {
          material: 'aluminium',
          year: 2026,
          type: 'Exporter',
          months: [
            { month: 'Jan', tonnage: 1234.56 },
            { month: 'Feb', tonnage: 0 }
          ]
        },
        {
          material: 'glass_re_melt',
          year: 2026,
          type: 'Reprocessor',
          months: [
            { month: 'Jan', tonnage: 0 },
            { month: 'Feb', tonnage: 5678.9 }
          ]
        }
      ],
      total: 6913.46
    })

    await tonnageMonitoringPostController.handler(mockRequest, mockH)

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      mockRequest,
      '/v1/tonnage-monitoring'
    )

    const expectedCsv = [
      '"Tonnage by material"',
      '',
      '"Cumulative total of incoming tonnage, excluding any PRN or sent-on deductions. Includes all uploaded records regardless of accreditation dates."',
      '',
      '"Data generated at: 29 January 2026 at 2:30pm"',
      '',
      '"Total: 6913.46"',
      '',
      '"Material","Type","Jan","Feb"',
      '"Aluminium","Exporter","1234.56","0.00"',
      '"Glass re-melt","Reprocessor","0.00","5678.90"'
    ].join('\n')

    expect(mockH.response).toHaveBeenCalledWith(expectedCsv)
    expect(mockResponse.header).toHaveBeenCalledWith('Content-Type', 'text/csv')
    expect(mockResponse.header).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="tonnage-monitoring.csv"'
    )
  })

  test('Should format material names to display names', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      generatedAt: '2026-01-29T09:00:00.000Z',
      materials: [
        {
          material: 'plastic',
          year: 2026,
          type: 'Exporter',
          months: [
            { month: 'Jan', tonnage: 100 },
            { month: 'Feb', tonnage: 0 }
          ]
        },
        {
          material: 'paper',
          year: 2026,
          type: 'Reprocessor',
          months: [
            { month: 'Jan', tonnage: 0 },
            { month: 'Feb', tonnage: 200 }
          ]
        }
      ],
      total: 300
    })

    await tonnageMonitoringPostController.handler(mockRequest, mockH)

    const csvContent = mockH.response.mock.calls[0][0]
    expect(csvContent).toContain('"Plastic","Exporter","100.00","0.00"')
    expect(csvContent).toContain(
      '"Paper and board","Reprocessor","0.00","200.00"'
    )
  })

  test('Should format tonnage values to 2 decimal places', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      generatedAt: '2026-01-29T12:00:00.000Z',
      materials: [
        {
          material: 'wood',
          year: 2026,
          type: 'Exporter',
          months: [
            { month: 'Jan', tonnage: 1000 },
            { month: 'Feb', tonnage: 0 }
          ]
        },
        {
          material: 'fibre',
          year: 2026,
          type: 'Reprocessor',
          months: [
            { month: 'Jan', tonnage: 0 },
            { month: 'Feb', tonnage: 99.1 }
          ]
        }
      ],
      total: 1099.1
    })

    await tonnageMonitoringPostController.handler(mockRequest, mockH)

    const csvContent = mockH.response.mock.calls[0][0]
    expect(csvContent).toContain('"Wood","Exporter","1000.00","0.00"')
    expect(csvContent).toContain(
      '"Fibre based composite","Reprocessor","0.00","99.10"'
    )
    expect(csvContent).toContain('"Total: 1099.10"')
  })

  test('Should format morning times correctly', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      generatedAt: '2026-06-15T09:05:00.000Z',
      materials: [],
      total: 0
    })

    await tonnageMonitoringPostController.handler(mockRequest, mockH)

    const csvContent = mockH.response.mock.calls[0][0]
    expect(csvContent).toContain('Data generated at: 15 June 2026 at')
  })

  test('Should handle empty materials array', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      generatedAt: '2026-01-29T12:00:00.000Z',
      materials: [],
      total: 0
    })

    await tonnageMonitoringPostController.handler(mockRequest, mockH)

    const expectedCsv = [
      '"Tonnage by material"',
      '',
      '"Cumulative total of incoming tonnage, excluding any PRN or sent-on deductions. Includes all uploaded records regardless of accreditation dates."',
      '',
      '"Data generated at: 29 January 2026 at 12:00pm"',
      '',
      '"Total: 0.00"',
      '',
      '"Material","Type"'
    ].join('\n')

    expect(mockH.response).toHaveBeenCalledWith(expectedCsv)
  })

  test('Should include year column when multiple years present', async () => {
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

    await tonnageMonitoringPostController.handler(mockRequest, mockH)

    const csvContent = mockH.response.mock.calls[0][0]
    expect(csvContent).toContain('"Material","Type","Year","Dec"')
    expect(csvContent).toContain('"Plastic","Exporter","2025","100.00"')
    expect(csvContent).toContain('"Plastic","Exporter","2026","150.00"')
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

    await tonnageMonitoringPostController.handler(mockRequest, mockH)

    const csvContent = mockH.response.mock.calls[0][0]
    expect(csvContent).toContain('"Material","Type","Jan","Feb","Mar"')
    expect(csvContent).toContain(
      '"Plastic","Exporter","100.00","150.00","200.00"'
    )
    expect(csvContent).toContain('"Aluminium","Exporter","50.00","",""')
  })

  test('Should redirect with error message on fetch failure', async () => {
    fetchJsonFromBackend.mockRejectedValue(new Error('Network error'))

    const result = await tonnageMonitoringPostController.handler(
      mockRequest,
      mockH
    )

    expect(mockRequest.yar.set).toHaveBeenCalledWith(
      'error',
      'There was a problem downloading the tonnage data. Please try again.'
    )
    expect(mockH.redirect).toHaveBeenCalledWith('/tonnage-monitoring')
    expect(result).toBe('redirect-response')
  })

  test('Should use error message from backend when available', async () => {
    const error = new Error('Backend error')
    error.output = { payload: { message: 'Custom backend error message' } }
    fetchJsonFromBackend.mockRejectedValue(error)

    await tonnageMonitoringPostController.handler(mockRequest, mockH)

    expect(mockRequest.yar.set).toHaveBeenCalledWith(
      'error',
      'Custom backend error message'
    )
  })
})
