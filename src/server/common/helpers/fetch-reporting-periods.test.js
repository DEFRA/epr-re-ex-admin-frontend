import { vi } from 'vitest'
import { fetchReportingPeriods } from './fetch-reporting-periods.js'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

/** @import { HapiRequest } from '#server/common/hapi-types.js' */

vi.mock('#server/common/helpers/fetch-json-from-backend.js', () => ({
  fetchJsonFromBackend: vi.fn()
}))

const mockRequest = /** @type {HapiRequest} */ ({})
const keys = {
  organisationNumber: '500123',
  registrationNumber: 'REG-50030-001',
  year: 2025
}
const quarter = { cadence: 'quarterly', period: 1, startDate: '2026-01-01' }
const march = { cadence: 'monthly', period: 3, startDate: '2026-03-01' }
const april = { cadence: 'monthly', period: 4, startDate: '2026-04-01' }

const mockFetchJsonFromBackend = vi.mocked(fetchJsonFromBackend)

describe('fetchReportingPeriods', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("reads the year's calendar with every submission", async () => {
    mockFetchJsonFromBackend.mockResolvedValue({ year: 2025 })

    await fetchReportingPeriods(mockRequest, keys)

    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      mockRequest,
      '/organisations/500123/registrations/REG-50030-001/reports/2025/calendar?expand=submissions',
      {}
    )
  })

  test('lists registered-only and accredited periods together in date order', async () => {
    mockFetchJsonFromBackend.mockResolvedValue({
      year: 2026,
      registeredOnly: { reportingPeriods: [quarter] },
      accredited: {
        accreditationNumber: 'ACC-1',
        reportingPeriods: [april, march]
      }
    })

    await expect(fetchReportingPeriods(mockRequest, keys)).resolves.toEqual([
      quarter,
      march,
      april
    ])
  })

  test('lists none for a year with no ended period', async () => {
    mockFetchJsonFromBackend.mockResolvedValue({ year: 2026 })

    await expect(fetchReportingPeriods(mockRequest, keys)).resolves.toEqual([])
  })
})
