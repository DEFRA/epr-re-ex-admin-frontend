import { creditedTonnagePostController } from './controller.post.js'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

vi.mock('#server/common/helpers/fetch-json-from-backend.js', () => ({
  fetchJsonFromBackend: vi.fn()
}))

const mockFetchJsonFromBackend = vi.mocked(fetchJsonFromBackend)

const { mockLoggerError } = vi.hoisted(() => ({ mockLoggerError: vi.fn() }))
vi.mock('#server/common/helpers/logging/logger.js', () => ({
  createLogger: () => ({ error: mockLoggerError })
}))

const buildRow = (overrides = {}) => ({
  month: '2026-01',
  organisation: { id: '0000-0000-uuid', reference: '500001' },
  accreditation: {
    id: '1111-1111-uuid',
    accreditationNumber: 'ACC-456',
    processingType: 'reprocessor',
    material: 'plastic'
  },
  tonnage: {
    totalCredited: 1000,
    eligibleForWasteBalance: 900,
    sentOnDeductions: 50
  },
  ...overrides
})

const dataLines = (csv) => csv.split(/\r?\n/).filter((line) => line.length > 0)

describe('creditedTonnagePostController', () => {
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

  test('fetches data from the correct backend path', async () => {
    mockFetchJsonFromBackend.mockResolvedValue({
      meta: { generatedAt: '2026-07-16T12:00:00.000Z' },
      data: []
    })

    await creditedTonnagePostController.handler(mockRequest, mockH)

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      mockRequest,
      '/v1/admin/waste-balances/credited-tonnage'
    )
  })

  test('sets Content-Type and a timestamped Content-Disposition filename', async () => {
    mockFetchJsonFromBackend.mockResolvedValue({
      meta: { generatedAt: '2026-07-16T12:00:00.000Z' },
      data: []
    })

    await creditedTonnagePostController.handler(mockRequest, mockH)

    expect(mockResponse.header).toHaveBeenCalledWith('Content-Type', 'text/csv')
    expect(mockResponse.header).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="credited-tonnage-2026-07-16T12-00-00Z.csv"'
    )
  })

  test('emits the documented header row as the first line', async () => {
    mockFetchJsonFromBackend.mockResolvedValue({
      meta: { generatedAt: '2026-07-16T12:00:00.000Z' },
      data: []
    })

    await creditedTonnagePostController.handler(mockRequest, mockH)

    const csv = mockH.response.mock.calls[0][0]
    expect(dataLines(csv)[0]).toBe(
      'month,organisation_id,accreditation_number,material,processing_type,total_credited,eligible_for_waste_balance,sent_on_deductions'
    )
  })

  test('downloads a header-only CSV for an empty dataset', async () => {
    mockFetchJsonFromBackend.mockResolvedValue({
      meta: { generatedAt: '2026-07-16T12:00:00.000Z' },
      data: []
    })

    await creditedTonnagePostController.handler(mockRequest, mockH)

    const csv = mockH.response.mock.calls[0][0]
    expect(dataLines(csv)).toHaveLength(1)
  })

  test('writes a data row of raw API values with 2dp numbers', async () => {
    mockFetchJsonFromBackend.mockResolvedValue({
      meta: { generatedAt: '2026-07-16T12:00:00.000Z' },
      data: [buildRow()]
    })

    await creditedTonnagePostController.handler(mockRequest, mockH)

    const csv = mockH.response.mock.calls[0][0]
    expect(dataLines(csv)[1]).toBe(
      '2026-01,500001,ACC-456,plastic,reprocessor,1000.00,900.00,50.00'
    )
  })

  test('uses the organisation reference, never the internal UUID', async () => {
    mockFetchJsonFromBackend.mockResolvedValue({
      meta: { generatedAt: '2026-07-16T12:00:00.000Z' },
      data: [buildRow()]
    })

    await creditedTonnagePostController.handler(mockRequest, mockH)

    const csv = mockH.response.mock.calls[0][0]
    expect(csv).toContain('500001')
    expect(csv).not.toContain('0000-0000-uuid')
  })

  test('keeps material and processing type as raw lowercase API values', async () => {
    mockFetchJsonFromBackend.mockResolvedValue({
      meta: { generatedAt: '2026-07-16T12:00:00.000Z' },
      data: [
        buildRow({
          accreditation: {
            id: '1111-1111-uuid',
            accreditationNumber: 'ACC-789',
            processingType: 'exporter',
            material: 'glass_re_melt'
          }
        })
      ]
    })

    await creditedTonnagePostController.handler(mockRequest, mockH)

    const csv = mockH.response.mock.calls[0][0]
    const row = dataLines(csv)[1]
    expect(row).toContain('glass_re_melt')
    expect(row).toContain('exporter')
    expect(csv).not.toContain('Glass re-melt')
    expect(csv).not.toContain('Exporter')
  })

  test('formats decimal tonnage to two places', async () => {
    mockFetchJsonFromBackend.mockResolvedValue({
      meta: { generatedAt: '2026-07-16T12:00:00.000Z' },
      data: [
        buildRow({
          tonnage: {
            totalCredited: 12.5,
            eligibleForWasteBalance: 0,
            sentOnDeductions: 3.456
          }
        })
      ]
    })

    await creditedTonnagePostController.handler(mockRequest, mockH)

    const csv = mockH.response.mock.calls[0][0]
    expect(dataLines(csv)[1]).toContain('12.50,0.00,3.46')
  })

  test('does not apply en-GB thousands separators to numbers', async () => {
    mockFetchJsonFromBackend.mockResolvedValue({
      meta: { generatedAt: '2026-07-16T12:00:00.000Z' },
      data: [
        buildRow({
          tonnage: {
            totalCredited: 1234567,
            eligibleForWasteBalance: 1000,
            sentOnDeductions: 0
          }
        })
      ]
    })

    await creditedTonnagePostController.handler(mockRequest, mockH)

    const csv = mockH.response.mock.calls[0][0]
    expect(csv).toContain('1234567.00')
    expect(csv).not.toContain('1,234,567')
    expect(csv).not.toContain('1,000.00')
  })

  test('emits one CSV data line per backend row in the received order', async () => {
    mockFetchJsonFromBackend.mockResolvedValue({
      meta: { generatedAt: '2026-07-16T12:00:00.000Z' },
      data: [
        buildRow({ month: '2026-01' }),
        buildRow({ month: '2026-02' }),
        buildRow({ month: '2026-03' })
      ]
    })

    await creditedTonnagePostController.handler(mockRequest, mockH)

    const csv = mockH.response.mock.calls[0][0]
    const lines = dataLines(csv)
    expect(lines).toHaveLength(4)
    expect(lines[1]).toMatch(/^2026-01,/)
    expect(lines[2]).toMatch(/^2026-02,/)
    expect(lines[3]).toMatch(/^2026-03,/)
  })

  test('sanitizes formula injection on the accreditation number cell', async () => {
    mockFetchJsonFromBackend.mockResolvedValue({
      meta: { generatedAt: '2026-07-16T12:00:00.000Z' },
      data: [
        buildRow({
          accreditation: {
            id: '1111-1111-uuid',
            accreditationNumber: '=SUM(A1)',
            processingType: 'reprocessor',
            material: 'plastic'
          }
        })
      ]
    })

    await creditedTonnagePostController.handler(mockRequest, mockH)

    const csv = mockH.response.mock.calls[0][0]
    expect(csv).toContain("'=SUM(A1)")
    expect(csv).not.toContain(',=SUM(A1)')
  })

  test('sanitizes formula injection on the organisation reference cell', async () => {
    mockFetchJsonFromBackend.mockResolvedValue({
      meta: { generatedAt: '2026-07-16T12:00:00.000Z' },
      data: [
        buildRow({
          organisation: { id: '0000-0000-uuid', reference: '+CMD()' }
        })
      ]
    })

    await creditedTonnagePostController.handler(mockRequest, mockH)

    const csv = mockH.response.mock.calls[0][0]
    expect(csv).toContain("'+CMD()")
    expect(csv).not.toContain(',+CMD()')
  })

  test('redirects with a generic error message when the fetch fails', async () => {
    const error = new Error('Network error')
    mockFetchJsonFromBackend.mockRejectedValue(error)

    const result = await creditedTonnagePostController.handler(
      mockRequest,
      mockH
    )

    expect(mockLoggerError).toHaveBeenCalledWith({
      message: 'Failed to generate credited tonnage CSV',
      err: error
    })
    expect(mockRequest.yar.set).toHaveBeenCalledWith(
      'error',
      'There was a problem downloading the credited tonnage data. Please try again.'
    )
    expect(mockH.redirect).toHaveBeenCalledWith('/credited-tonnage')
    expect(result).toBe('redirect-response')
  })

  test('uses the backend payload error message when present', async () => {
    const error = /** @type {any} */ (new Error('Backend error'))
    error.output = { payload: { message: 'Custom backend error' } }
    mockFetchJsonFromBackend.mockRejectedValue(error)

    await creditedTonnagePostController.handler(mockRequest, mockH)

    expect(mockRequest.yar.set).toHaveBeenCalledWith(
      'error',
      'Custom backend error'
    )
  })
})
