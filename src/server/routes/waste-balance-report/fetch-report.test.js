import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { fetchWasteBalanceReport } from './fetch-report.js'

vi.mock('#server/common/helpers/fetch-json-from-backend.js', () => ({
  fetchJsonFromBackend: vi.fn()
}))

/**
 * @import { HapiRequest } from '#server/common/hapi-types.js'
 */

const request = /** @type {HapiRequest} */ (
  /** @type {unknown} */ ({ fake: 'request' })
)

describe('fetchWasteBalanceReport', () => {
  it('requests the report at the London closing cutoff of the month', async () => {
    const report = {
      cutoff: '2026-06-30T23:00:00Z',
      totals: [],
      accreditations: []
    }
    vi.mocked(fetchJsonFromBackend).mockResolvedValue(report)

    const result = await fetchWasteBalanceReport(request, '2026-06')

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      request,
      '/v1/admin/waste-balances/report?cutoff=2026-06-30T23%3A00%3A00.000Z'
    )
    expect(result).toEqual(report)
  })

  it('returns the report in canonical order: totals by material then type, accreditations by material, type, then accreditation number', async () => {
    const total = (material, wasteProcessingType) => ({
      material,
      wasteProcessingType,
      amount: 1,
      availableAmount: 1
    })
    const accreditation = (
      material,
      wasteProcessingType,
      accreditationNumber
    ) => ({
      orgId: '500001',
      registrationNumber: 'REG-1',
      accreditationNumber,
      material,
      wasteProcessingType,
      amount: 1,
      availableAmount: 1
    })
    vi.mocked(fetchJsonFromBackend).mockResolvedValue({
      cutoff: '2026-06-30T23:00:00Z',
      totals: [
        total('plastic', 'reprocessor'),
        total('glass', 'reprocessor'),
        total('plastic', 'exporter')
      ],
      accreditations: [
        accreditation('plastic', 'reprocessor', 'ACC-9'),
        accreditation('glass', 'reprocessor', 'ACC-5'),
        accreditation('plastic', 'reprocessor', 'ACC-1'),
        accreditation('plastic', 'exporter', 'ACC-7')
      ]
    })

    const result = await fetchWasteBalanceReport(request, '2026-06')

    expect(
      result.totals.map((t) => `${t.material}|${t.wasteProcessingType}`)
    ).toEqual(['glass|reprocessor', 'plastic|exporter', 'plastic|reprocessor'])
    expect(result.accreditations.map((a) => a.accreditationNumber)).toEqual([
      'ACC-5',
      'ACC-7',
      'ACC-1',
      'ACC-9'
    ])
  })

  it('maps a GMT month to a midnight UTC cutoff', async () => {
    vi.mocked(fetchJsonFromBackend).mockResolvedValue({
      cutoff: '2027-01-01T00:00:00Z',
      totals: [],
      accreditations: []
    })

    await fetchWasteBalanceReport(request, '2026-12')

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      request,
      '/v1/admin/waste-balances/report?cutoff=2027-01-01T00%3A00%3A00.000Z'
    )
  })
})
