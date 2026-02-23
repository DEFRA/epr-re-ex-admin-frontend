import { vi } from 'vitest'
import { prnTonnageGetController } from './controller.get.js'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

vi.mock('#server/common/helpers/fetch-json-from-backend.js', () => ({
  fetchJsonFromBackend: vi.fn()
}))

describe('prn-tonnage GET controller', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      route: {
        settings: {
          app: { pageTitle: 'PRN tonnage' }
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

  test('Should fetch PRN tonnage data from backend and render page', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      generatedAt: '2026-02-20T12:00:00.000Z',
      rows: [
        {
          organisationName: 'Acme Recycling',
          organisationId: 'ORG001',
          accreditationNumber: 'ACC-100',
          material: 'glass_re_melt',
          tonnageBand: 'up_to_5000',
          createdTonnage: 100,
          issuedTonnage: 20.5,
          cancelledTonnage: 1
        }
      ]
    })

    await prnTonnageGetController.handler(mockRequest, mockH)

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      mockRequest,
      '/v1/prn-tonnage'
    )

    expect(mockH.view).toHaveBeenCalledWith('routes/prn-tonnage/index', {
      pageTitle: 'PRN tonnage',
      generatedAt: '2026-02-20T12:00:00.000Z',
      rows: [
        {
          organisationName: 'Acme Recycling',
          organisationId: 'ORG001',
          accreditationNumber: 'ACC-100',
          material: 'Glass re-melt',
          tonnageBand: 'Up to 5,000 tonnes',
          createdTonnage: '100.00',
          issuedTonnage: '20.50',
          cancelledTonnage: '1.00'
        }
      ],
      error: null
    })
  })

  test('Should display error message from session and clear it', async () => {
    mockRequest.yar.get.mockReturnValue('Download failed')
    fetchJsonFromBackend.mockResolvedValue({
      generatedAt: '2026-02-20T12:00:00.000Z',
      rows: []
    })

    await prnTonnageGetController.handler(mockRequest, mockH)

    expect(mockRequest.yar.get).toHaveBeenCalledWith('error')
    expect(mockRequest.yar.clear).toHaveBeenCalledWith('error')
    expect(mockH.view).toHaveBeenCalledWith(
      'routes/prn-tonnage/index',
      expect.objectContaining({
        error: 'Download failed',
        rows: []
      })
    )
  })

  test('Should keep unknown values and blank tonnage band for missing band', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      generatedAt: '2026-02-20T12:00:00.000Z',
      rows: [
        {
          organisationName: 'Beta',
          organisationId: 'ORG002',
          accreditationNumber: 'ACC-200',
          material: 'mystery_material',
          tonnageBand: null,
          createdTonnage: 0,
          issuedTonnage: 0,
          cancelledTonnage: 0
        }
      ]
    })

    await prnTonnageGetController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith(
      'routes/prn-tonnage/index',
      expect.objectContaining({
        rows: [
          expect.objectContaining({
            material: 'mystery_material',
            tonnageBand: '',
            createdTonnage: '0.00',
            issuedTonnage: '0.00',
            cancelledTonnage: '0.00'
          })
        ]
      })
    )
  })
})
