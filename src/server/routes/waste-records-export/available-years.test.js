import { describe, expect, it, vi } from 'vitest'

import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { fetchAvailableYears } from './available-years.js'

vi.mock('#server/common/helpers/fetch-json-from-backend.js', () => ({
  fetchJsonFromBackend: vi.fn()
}))

describe('fetchAvailableYears', () => {
  it('reads the years from the backend, keeping its order', async () => {
    vi.mocked(fetchJsonFromBackend).mockResolvedValue({
      years: [{ year: 2027 }, { year: 2026 }]
    })
    const request = /** @type {any} */ ({})

    expect(await fetchAvailableYears(request)).toEqual(['2027', '2026'])
    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      request,
      '/waste-records/years',
      {}
    )
  })
})
