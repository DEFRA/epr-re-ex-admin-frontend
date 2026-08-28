import { creditedTonnageGetController } from './controller.get.js'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

vi.mock('#server/common/helpers/fetch-json-from-backend.js', () => ({
  fetchJsonFromBackend: vi.fn()
}))

const mockFetchJsonFromBackend = vi.mocked(fetchJsonFromBackend)

describe('credited-tonnage GET controller', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      yar: {
        get: vi.fn().mockReturnValue(null),
        clear: vi.fn()
      }
    }

    mockH = {
      view: vi.fn().mockReturnValue('rendered-view')
    }
  })

  test('fetches credited tonnage data and renders the mapped table', async () => {
    mockFetchJsonFromBackend.mockResolvedValue({
      meta: { generatedAt: '2026-07-16T12:00:00.000Z' },
      data: [
        {
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
          }
        }
      ]
    })

    await creditedTonnageGetController.handler(mockRequest, mockH)

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      mockRequest,
      '/v1/admin/waste-balances/credited-tonnage'
    )

    const viewCall = mockH.view.mock.calls[0]
    expect(viewCall[0]).toBe('routes/credited-tonnage/index')
    expect(viewCall[1].pageTitle).toBe('Tonnage credited to waste balances')
    expect(viewCall[1].generatedAt).toBe('2026-07-16T12:00:00.000Z')
    expect(viewCall[1].error).toBeNull()
    expect(viewCall[1].rows).toEqual([
      {
        month: 'January 2026',
        organisationId: '500001',
        accreditationNumber: 'ACC-456',
        material: 'Plastic',
        type: 'Reprocessor',
        totalCredited: '1,000.00',
        eligibleForWasteBalance: '900.00',
        sentOnDeductions: '50.00'
      }
    ])
  })

  test('renders an empty rows array for an empty dataset', async () => {
    mockFetchJsonFromBackend.mockResolvedValue({
      meta: { generatedAt: '2026-07-16T12:00:00.000Z' },
      data: []
    })

    await creditedTonnageGetController.handler(mockRequest, mockH)

    const viewCall = mockH.view.mock.calls[0]
    expect(viewCall[1].rows).toEqual([])
  })

  test('reads and clears the error flash and passes it to the view', async () => {
    mockRequest.yar.get.mockReturnValue('Download failed')

    mockFetchJsonFromBackend.mockResolvedValue({
      meta: { generatedAt: '2026-07-16T12:00:00.000Z' },
      data: []
    })

    await creditedTonnageGetController.handler(mockRequest, mockH)

    expect(mockRequest.yar.get).toHaveBeenCalledWith('error')
    expect(mockRequest.yar.clear).toHaveBeenCalledWith('error')

    const viewCall = mockH.view.mock.calls[0]
    expect(viewCall[1].error).toBe('Download failed')
  })
})
