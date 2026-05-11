import { describe, it, expect, vi } from 'vitest'

import { wasteRecordsExportGetController } from './controller.get.js'

describe('wasteRecordsExportGetController', () => {
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
      error: undefined
    })
  })
})
