import {
  vi,
  describe,
  test,
  beforeAll,
  afterAll,
  beforeEach,
  expect
} from 'vitest'

import { fetchJsonFromBackend } from './fetchJsonFromBackend.js'
import { config } from '#config/config.js'

const mockLoggerError = vi.fn()

vi.mock('./logging/logger.js', () => ({
  createLogger: () => ({ error: (...args) => mockLoggerError(...args) })
}))

describe('#fetchJsonFromBackend', () => {
  const originalFetch = globalThis.fetch
  const originalBackendUrl = config.get('eprBackendUrl')
  const backendUrl = 'http://mock-backend'

  beforeAll(() => {
    config.set('eprBackendUrl', backendUrl)
  })

  afterAll(() => {
    config.set('eprBackendUrl', originalBackendUrl)
    globalThis.fetch = originalFetch
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('returns data when backend responds with ok=true', async () => {
    const mockData = { hello: 'world' }
    const json = vi.fn().mockResolvedValue(mockData)
    const response = { ok: true, json }

    const options = { method: 'GET', headers: { 'x-test': '1' } }

    globalThis.fetch = vi.fn().mockResolvedValue(response)

    const result = await fetchJsonFromBackend('/test', options)

    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    expect(globalThis.fetch).toHaveBeenCalledWith(`${backendUrl}/test`, options)

    expect(result).toEqual({ data: mockData })
    expect(json).toHaveBeenCalled()
    expect(mockLoggerError).not.toHaveBeenCalled()
  })

  test('returns unauthorised errorView when status is 401', async () => {
    const json = vi.fn()
    const response = {
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json
    }

    globalThis.fetch = vi.fn().mockResolvedValue(response)

    const result = await fetchJsonFromBackend('/secure', { method: 'GET' })

    expect(result).toEqual({ errorView: 'unauthorised' })
    expect(mockLoggerError).not.toHaveBeenCalled()
    expect(json).not.toHaveBeenCalled()
  })

  test('logs error and returns 500 errorView when response not ok (non-401)', async () => {
    const json = vi.fn()
    const response = {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json
    }

    globalThis.fetch = vi.fn().mockResolvedValue(response)

    const path = '/boom'
    const result = await fetchJsonFromBackend(path, { method: 'GET' })

    expect(result).toEqual({ errorView: '500' })
    expect(mockLoggerError).toHaveBeenCalledTimes(1)
    expect(mockLoggerError.mock.calls[0][0]).toContain(
      `Failed to fetch from backend at path: ${path}: 500 Internal Server Error`
    )
    expect(json).not.toHaveBeenCalled()
  })

  test('logs error and returns 500 errorView when fetch throws', async () => {
    const path = '/network'
    const err = new Error('network down')

    globalThis.fetch = vi.fn().mockRejectedValue(err)

    const result = await fetchJsonFromBackend(path, { method: 'GET' })

    expect(result).toEqual({ errorView: '500' })
    expect(mockLoggerError).toHaveBeenCalledTimes(1)
    expect(mockLoggerError.mock.calls[0][0]).toContain(
      `Failed to fetch from backend at path: ${path}: ${err.message}`
    )
  })
})
