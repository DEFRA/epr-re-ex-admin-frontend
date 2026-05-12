import { Readable } from 'node:stream'

import Boom from '@hapi/boom'
import { vi, describe, it, expect, beforeEach } from 'vitest'

import { wasteRecordsExportPostController } from './controller.post.js'
import * as streamFromBackendMod from '#server/common/helpers/stream-from-backend.js'

vi.mock('#server/common/helpers/stream-from-backend.js')

const { streamFromBackend } = vi.mocked(streamFromBackendMod)

const buildWebStream = (chunks) =>
  new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(new TextEncoder().encode(chunk))
      }
      controller.close()
    }
  })

const collectNodeStream = (stream) =>
  new Promise((resolve, reject) => {
    const parts = []
    stream.on('data', (c) => parts.push(c))
    stream.on('end', () => resolve(Buffer.concat(parts).toString('utf-8')))
    stream.on('error', reject)
  })

const { mockLoggerError } = vi.hoisted(() => ({ mockLoggerError: vi.fn() }))
vi.mock('#server/common/helpers/logging/logger.js', () => ({
  createLogger: () => ({ error: mockLoggerError })
}))

describe('wasteRecordsExportPostController', () => {
  beforeEach(() => vi.clearAllMocks())

  const buildHapiH = () => {
    /** @type {{ type: unknown[][], header: unknown[][] }} */
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
      response: vi.fn((/** @type {unknown} */ _body) => responseBuilder),
      redirect: vi.fn().mockReturnValue('redirect-response')
    }
    return { h, responseBuilder, calls }
  }

  it('converts the backend Web ReadableStream to a Node Readable and preserves the CSV chunks', async () => {
    streamFromBackend.mockResolvedValue(
      /** @type {Response} */ ({
        body: buildWebStream(['header1,header2\n', 'a,b\n', 'c,d\n']),
        headers: new Headers({
          'content-type': 'text/csv; charset=utf-8',
          'content-disposition':
            'attachment; filename="waste-records-2026-05-08T10-00-00Z.csv"'
        })
      })
    )

    const { h, calls } = buildHapiH()
    const request = { yar: { set: vi.fn() } }

    await wasteRecordsExportPostController.handler(request, h)

    expect(streamFromBackend).toHaveBeenCalledWith(
      request,
      '/v1/admin/waste-records/export.csv'
    )

    const passedBody = h.response.mock.calls[0][0]
    expect(passedBody).toBeInstanceOf(Readable)
    expect(await collectNodeStream(passedBody)).toBe(
      'header1,header2\na,b\nc,d\n'
    )

    expect(calls.type).toEqual([['text/csv; charset=utf-8']])
    expect(calls.header).toEqual([
      [
        'Content-Disposition',
        'attachment; filename="waste-records-2026-05-08T10-00-00Z.csv"'
      ]
    ])
  })

  it('falls back to default content-type and disposition when backend headers are missing', async () => {
    streamFromBackend.mockResolvedValue(
      /** @type {Response} */ ({
        body: buildWebStream([]),
        headers: new Headers({})
      })
    )

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
    const error = Boom.internal('upstream')
    error.output.payload.message = 'Backend exploded'
    streamFromBackend.mockRejectedValue(error)

    const { h } = buildHapiH()
    const yarSet = vi.fn()
    const request = { yar: { set: yarSet } }

    await wasteRecordsExportPostController.handler(request, h)

    expect(yarSet).toHaveBeenCalledWith('error', 'Backend exploded')
  })

  it('logs and redirects with a flash error when the backend response has no body', async () => {
    streamFromBackend.mockResolvedValue(
      /** @type {Response} */ ({ body: null, headers: new Headers() })
    )

    const { h } = buildHapiH()
    const yarSet = vi.fn()
    const request = { yar: { set: yarSet } }

    const result = await wasteRecordsExportPostController.handler(request, h)

    expect(mockLoggerError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Failed to stream waste records export'
      })
    )
    expect(yarSet).toHaveBeenCalledWith('error', expect.any(String))
    expect(h.redirect).toHaveBeenCalledWith('/waste-records-export')
    expect(result).toBe('redirect-response')
  })
})
