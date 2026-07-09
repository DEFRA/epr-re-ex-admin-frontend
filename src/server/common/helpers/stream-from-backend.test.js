import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { streamFromBackend } from './stream-from-backend.js'

/** @import { HapiRequest } from '#server/common/hapi-types.js' */

const { mockUserSession, mockConfigGet } = vi.hoisted(() => ({
  mockUserSession: vi.fn(),
  mockConfigGet: vi.fn()
}))

vi.mock('./auth/get-user-session.js', () => ({
  getUserSession: (req) => mockUserSession(req)
}))

vi.mock('#config/config.js', () => ({
  config: { get: (k) => mockConfigGet(k) }
}))

const fetchSpy = vi.fn()
beforeEach(() => {
  globalThis.fetch = fetchSpy
  mockConfigGet.mockImplementation((k) =>
    k === 'eprBackendUrl' ? 'http://backend' : ''
  )
  mockUserSession.mockResolvedValue({ token: 'abc' })
})
afterEach(() => {
  fetchSpy.mockReset()
})

describe('streamFromBackend', () => {
  it('returns the response body and headers when status is 2xx', async () => {
    const body = new ReadableStream({
      start(c) {
        c.enqueue(new Uint8Array([0x68, 0x69]))
        c.close()
      }
    })
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({
        'content-type': 'text/csv',
        'content-disposition': 'attachment; filename="x.csv"'
      }),
      body
    })

    const result = await streamFromBackend(
      /** @type {HapiRequest} */ ({ yar: {} }),
      '/x'
    )
    expect(result.status).toBe(200)
    expect(result.headers.get('content-type')).toBe('text/csv')
    expect(result.body).toBe(body)
    expect(fetchSpy).toHaveBeenCalledWith(
      'http://backend/x',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer abc' })
      })
    )
  })

  it('throws a Boom error when the response is not ok', async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({}),
      body: null
    })

    await expect(
      streamFromBackend(/** @type {HapiRequest} */ ({ yar: {} }), '/x')
    ).rejects.toMatchObject({
      isBoom: true,
      output: { statusCode: 503 }
    })
  })

  it('throws an internal error if fetch itself rejects', async () => {
    fetchSpy.mockRejectedValue(new Error('network down'))
    await expect(
      streamFromBackend(/** @type {HapiRequest} */ ({ yar: {} }), '/x')
    ).rejects.toMatchObject({
      isBoom: true
    })
  })
})
