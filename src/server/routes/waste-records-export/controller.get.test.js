import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'

import { fetchAvailableYears } from './available-years.js'
import { wasteRecordsExportGetController } from './controller.get.js'

vi.mock('./available-years.js', () => ({
  fetchAvailableYears: vi.fn()
}))

describe('wasteRecordsExportGetController', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-16T00:00:00Z'))
    vi.mocked(fetchAvailableYears).mockResolvedValue(['2027', '2026'])
  })

  afterEach(() => vi.useRealTimers())

  const yearItems = [
    { value: '2027', text: '2027', selected: false },
    { value: '2026', text: '2026', selected: true }
  ]

  it('offers the backend years in its order with the current year selected', async () => {
    const view = vi.fn()
    const request = {
      yar: { get: vi.fn(), clear: vi.fn() }
    }

    await wasteRecordsExportGetController.handler(request, { view })

    expect(fetchAvailableYears).toHaveBeenCalledWith(request)
    expect(view.mock.calls[0][1].yearItems).toEqual(yearItems)
  })

  it('renders the index view with pageTitle and any flash error', async () => {
    const view = vi.fn()
    const yarGet = vi.fn().mockReturnValue('Something failed')
    const yarClear = vi.fn()
    const request = { yar: { get: yarGet, clear: yarClear } }
    const h = { view }

    await wasteRecordsExportGetController.handler(request, h)

    expect(yarGet).toHaveBeenCalledWith('error')
    expect(yarClear).toHaveBeenCalledWith('error')
    expect(view).toHaveBeenCalledWith('routes/waste-records-export/index', {
      pageTitle: 'Waste records export',
      yearItems,
      error: 'Something failed'
    })
  })

  it('renders without error when none was flashed', async () => {
    const view = vi.fn()
    const request = {
      yar: { get: vi.fn().mockReturnValue(undefined), clear: vi.fn() }
    }
    const h = { view }

    await wasteRecordsExportGetController.handler(request, h)

    expect(view).toHaveBeenCalledWith('routes/waste-records-export/index', {
      pageTitle: 'Waste records export',
      yearItems,
      error: undefined
    })
  })
})
