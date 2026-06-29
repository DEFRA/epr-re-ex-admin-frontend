import { Readable } from 'node:stream'

import { vi, describe, it, expect, beforeEach } from 'vitest'

import { proxyCsvStream } from './proxy-csv-stream.js'
import { streamFromBackend } from '#server/common/helpers/stream-from-backend.js'

vi.mock('#server/common/helpers/stream-from-backend.js', () => ({
  streamFromBackend: vi.fn()
}))

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

const buildHapiH = () => {
  const responseBuilder = {
    type: vi.fn().mockReturnThis(),
    header: vi.fn().mockReturnThis()
  }
  const h = { response: vi.fn().mockReturnValue(responseBuilder) }
  return { h, responseBuilder }
}

const request = /** @type {any} */ ({})

describe('proxyCsvStream', () => {
  beforeEach(() => vi.clearAllMocks())

  it('streams the backend body as a Node Readable, preserving headers', async () => {
    vi.mocked(streamFromBackend).mockResolvedValue(
      /** @type {any} */ ({
        body: buildWebStream(['header\n', 'a,b\n']),
        headers: new Headers({
          'content-type': 'text/csv; charset=utf-8',
          'content-disposition': 'attachment; filename="scoped.csv"'
        })
      })
    )

    const { h, responseBuilder } = buildHapiH()

    await proxyCsvStream(request, h, '/some/path?x=1', 'fallback.csv')

    expect(streamFromBackend).toHaveBeenCalledWith(request, '/some/path?x=1')

    const passedBody = h.response.mock.calls[0][0]
    expect(passedBody).toBeInstanceOf(Readable)
    expect(await collectNodeStream(passedBody)).toBe('header\na,b\n')
    expect(responseBuilder.type).toHaveBeenCalledWith('text/csv; charset=utf-8')
    expect(responseBuilder.header).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="scoped.csv"'
    )
  })

  it('falls back to default content-type and the given filename when headers are missing', async () => {
    vi.mocked(streamFromBackend).mockResolvedValue(
      /** @type {any} */ ({
        body: buildWebStream([]),
        headers: new Headers({})
      })
    )

    const { h, responseBuilder } = buildHapiH()

    await proxyCsvStream(request, h, '/some/path', 'fallback.csv')

    expect(responseBuilder.type).toHaveBeenCalledWith('text/csv; charset=utf-8')
    expect(responseBuilder.header).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="fallback.csv"'
    )
  })

  it('throws when the backend response has no body', async () => {
    vi.mocked(streamFromBackend).mockResolvedValue(
      /** @type {any} */ ({ body: null, headers: new Headers() })
    )

    const { h } = buildHapiH()

    await expect(
      proxyCsvStream(request, h, '/some/path', 'fallback.csv')
    ).rejects.toThrow(/no body/)
  })
})
