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
    expect(result).toBe(report)
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
