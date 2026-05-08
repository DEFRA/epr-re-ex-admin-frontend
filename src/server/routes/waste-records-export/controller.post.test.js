import { vi, describe, it, expect, beforeEach } from 'vitest'

import { wasteRecordsExportPostController } from './controller.post.js'
import { streamFromBackend } from '#server/common/helpers/stream-from-backend.js'

vi.mock('#server/common/helpers/stream-from-backend.js', () => ({
  streamFromBackend: vi.fn()
}))

const { mockLoggerError } = vi.hoisted(() => ({ mockLoggerError: vi.fn() }))
vi.mock('#server/common/helpers/logging/logger.js', () => ({
  createLogger: () => ({ error: mockLoggerError })
}))

describe('wasteRecordsExportPostController', () => {
  beforeEach(() => vi.clearAllMocks())

  const buildHapiH = () => {
    const calls = { type: [], header: [] }
    const responseBuilder = {
      type: vi.fn(function (...args) {
        calls.type.push(args)
        return this
      }),
      header: vi.fn(function (...args) {
        calls.header.push(args)
        return this
      })
    }
    const h = {
      response: vi.fn(() => responseBuilder),
      redirect: vi.fn().mockReturnValue('redirect-response')
    }
    return { h, responseBuilder, calls }
  }

  it('proxies the backend response body and copies content-type/disposition headers', async () => {
    const fakeBody = {}
    streamFromBackend.mockResolvedValue({
      body: fakeBody,
      headers: new Headers({
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition':
          'attachment; filename="waste-records-2026-05-08T10-00-00Z.csv"'
      })
    })

    const { h, calls } = buildHapiH()
    const request = { yar: { set: vi.fn() } }

    await wasteRecordsExportPostController.handler(request, h)

    expect(streamFromBackend).toHaveBeenCalledWith(
      request,
      '/v1/admin/waste-records/export.csv'
    )
    expect(h.response).toHaveBeenCalledWith(fakeBody)
    expect(calls.type).toEqual([['text/csv; charset=utf-8']])
    expect(calls.header).toEqual([
      [
        'Content-Disposition',
        'attachment; filename="waste-records-2026-05-08T10-00-00Z.csv"'
      ]
    ])
  })

  it('falls back to default content-type and disposition when backend headers are missing', async () => {
    streamFromBackend.mockResolvedValue({
      body: {},
      headers: new Headers({})
    })

    const { h, calls } = buildHapiH()
    const request = { yar: { set: vi.fn() } }

    await wasteRecordsExportPostController.handler(request, h)

    expect(calls.type).toEqual([['text/csv; charset=utf-8']])
    expect(calls.header).toEqual([
      ['Content-Disposition', 'attachment; filename="waste-records.csv"']
    ])
  })

  it('redirects with a flash error when the backend call fails', async () => {
    const error = new Error('boom')
    streamFromBackend.mockRejectedValue(error)

    const { h } = buildHapiH()
    const yarSet = vi.fn()
    const request = { yar: { set: yarSet } }

    const result = await wasteRecordsExportPostController.handler(request, h)

    expect(mockLoggerError).toHaveBeenCalledWith({
      message: 'Failed to stream waste records export',
      err: error
    })
    expect(yarSet).toHaveBeenCalledWith('error', expect.any(String))
    expect(h.redirect).toHaveBeenCalledWith('/waste-records-export')
    expect(result).toBe('redirect-response')
  })

  it('uses the Boom payload message when available', async () => {
    const error = new Error('upstream')
    error.output = { payload: { message: 'Backend exploded' } }
    streamFromBackend.mockRejectedValue(error)

    const { h } = buildHapiH()
    const yarSet = vi.fn()
    const request = { yar: { set: yarSet } }

    await wasteRecordsExportPostController.handler(request, h)

    expect(yarSet).toHaveBeenCalledWith('error', 'Backend exploded')
  })
})
