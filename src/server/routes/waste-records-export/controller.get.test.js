import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'

import { wasteRecordsExportGetController } from './controller.get.js'

describe('wasteRecordsExportGetController', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2027-03-01T00:00:00Z'))
  })

  afterEach(() => vi.useRealTimers())

  const yearItems = [
    { value: '2026', text: '2026', selected: false },
    { value: '2027', text: '2027', selected: true }
  ]

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
