import { vi } from 'vitest'
import { prnTonnageResultsGetController } from './controller.results.get.js'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

vi.mock('#server/common/helpers/fetch-json-from-backend.js', () => ({
  fetchJsonFromBackend: vi.fn()
}))

describe('prn-tonnage results GET controller', () => {
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

  test('Should fetch PRN tonnage data from backend and render results page', async () => {
    fetchJsonFromBackend.mockResolvedValue({
      generatedAt: '2026-02-20T12:00:00.000Z',
      rows: [
        {
          organisationName: 'Acme Recycling',
          organisationId: 'ORG001',
          accreditationNumber: 'ACC-100',
          material: 'glass_re_melt',
          tonnageBand: 'up_to_5000',
          awaitingAuthorisationTonnage: 100,
          awaitingAcceptanceTonnage: 20,
          awaitingCancellationTonnage: 2,
          acceptedTonnage: 10,
          cancelledTonnage: 1
        }
      ]
    })

    await prnTonnageResultsGetController.handler(mockRequest, mockH)

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      mockRequest,
      '/v1/prn-tonnage'
    )

    expect(mockH.view).toHaveBeenCalledWith('routes/prn-tonnage/results', {
      pageTitle: 'PRN tonnage',
      generatedAt: '2026-02-20T12:00:00.000Z',
      rows: [
        {
          organisationName: 'Acme Recycling',
          organisationId: 'ORG001',
          accreditationNumber: 'ACC-100',
          material: 'Glass re-melt',
          tonnageBand: 'Up to 5,000 tonnes',
          awaitingAuthorisationTonnage: '100',
          awaitingAcceptanceTonnage: '20',
          awaitingCancellationTonnage: '2',
          acceptedTonnage: '10',
          cancelledTonnage: '1'
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

    await prnTonnageResultsGetController.handler(mockRequest, mockH)

    expect(mockRequest.yar.get).toHaveBeenCalledWith('error')
    expect(mockRequest.yar.clear).toHaveBeenCalledWith('error')
    expect(mockH.view).toHaveBeenCalledWith(
      'routes/prn-tonnage/results',
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
          awaitingAuthorisationTonnage: 0,
          awaitingAcceptanceTonnage: 0,
          awaitingCancellationTonnage: 0,
          acceptedTonnage: 0,
          cancelledTonnage: 0
        }
      ]
    })

    await prnTonnageResultsGetController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith(
      'routes/prn-tonnage/results',
      expect.objectContaining({
        rows: [
          expect.objectContaining({
            material: 'mystery_material',
            tonnageBand: '',
            awaitingAuthorisationTonnage: '0',
            awaitingAcceptanceTonnage: '0',
            awaitingCancellationTonnage: '0',
            acceptedTonnage: '0',
            cancelledTonnage: '0'
          })
        ]
      })
    )
  })
})
