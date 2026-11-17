import { describe, expect, it, vi } from 'vitest'

import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { fetchWasteRecordYears } from './fetch-waste-record-years.js'

vi.mock('#server/common/helpers/fetch-json-from-backend.js', () => ({
  fetchJsonFromBackend: vi.fn()
}))

describe('fetchWasteRecordYears', () => {
  it('reads the years from the backend, keeping its order', async () => {
    vi.mocked(fetchJsonFromBackend).mockResolvedValue({
      years: [{ year: 2027 }, { year: 2026 }]
    })
    const request = /** @type {any} */ ({})

    expect(await fetchWasteRecordYears(request)).toEqual(['2027', '2026'])
    expect(fetchJsonFromBackend).toHaveBeenCalledWith(
      request,
      '/waste-records/years',
      {}
    )
  })
})
