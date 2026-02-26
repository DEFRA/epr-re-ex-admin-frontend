import { vi, beforeEach, afterEach, describe, test, expect } from 'vitest'

const mockWreckGet = vi.fn()

vi.mock('@hapi/wreck', () => ({
  default: { get: (...args) => mockWreckGet(...args) }
}))

// Dynamic import so we get a fresh module (and cache state) for each test
let getOidcConfig

async function importFreshModule() {
  const mod = await import('./get-oidc-config.js')
  getOidcConfig = mod.getOidcConfig
}

const ONE_HOUR_MS = 60 * 60 * 1000

describe('#getOidcConfig', () => {
  const mockOidcPayload = {
    authorization_endpoint: 'https://example-auth.test/oauth/authorize',
    token_endpoint: 'https://example-auth.test/oauth/token',
    end_session_endpoint: 'https://example-auth.test/oauth/logout',
    jwks_uri: 'https://example-auth.test/discovery/keys'
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    vi.useFakeTimers()

    mockWreckGet.mockResolvedValue({ payload: mockOidcPayload })

    await importFreshModule()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.resetAllMocks()
  })

  test('Should fetch OIDC config from well-known endpoint with correct options', async () => {
    const result = await getOidcConfig()

    expect(mockWreckGet).toHaveBeenCalledTimes(1)
    expect(mockWreckGet).toHaveBeenCalledWith(
      expect.stringContaining('.well-known/openid-configuration'),
      { json: true }
    )
    expect(result).toEqual(mockOidcPayload)
  })

  test('Should return cached config on subsequent calls within TTL', async () => {
    await getOidcConfig()
    await getOidcConfig()
    await getOidcConfig()

    expect(mockWreckGet).toHaveBeenCalledTimes(1)
  })

  test('Should return same config object from cache', async () => {
    const first = await getOidcConfig()
    const second = await getOidcConfig()

    expect(first).toBe(second)
  })

  test('Should re-fetch config after TTL expires', async () => {
    await getOidcConfig()

    expect(mockWreckGet).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(ONE_HOUR_MS + 1)

    await getOidcConfig()

    expect(mockWreckGet).toHaveBeenCalledTimes(2)
  })

  test('Should not re-fetch config just before TTL expires', async () => {
    await getOidcConfig()

    vi.advanceTimersByTime(ONE_HOUR_MS - 1)

    await getOidcConfig()

    expect(mockWreckGet).toHaveBeenCalledTimes(1)
  })

  test('Should return fresh data after TTL expires', async () => {
    await getOidcConfig()

    const updatedPayload = {
      ...mockOidcPayload,
      token_endpoint: 'https://example-auth.test/oauth/token-v2'
    }

    mockWreckGet.mockResolvedValue({ payload: updatedPayload })

    vi.advanceTimersByTime(ONE_HOUR_MS + 1)

    const result = await getOidcConfig()

    expect(result).toEqual(updatedPayload)
  })

  test('Should propagate errors from Wreck', async () => {
    mockWreckGet.mockRejectedValue(new Error('Network error'))

    await expect(getOidcConfig()).rejects.toThrow('Network error')
  })

  test('Should not cache failed requests', async () => {
    mockWreckGet.mockRejectedValueOnce(new Error('Network error'))
    mockWreckGet.mockResolvedValueOnce({ payload: mockOidcPayload })

    await expect(getOidcConfig()).rejects.toThrow('Network error')

    const result = await getOidcConfig()

    expect(result).toEqual(mockOidcPayload)
    expect(mockWreckGet).toHaveBeenCalledTimes(2)
  })

  test('Should handle concurrent calls with a single fetch', async () => {
    const results = await Promise.all([
      getOidcConfig(),
      getOidcConfig(),
      getOidcConfig()
    ])

    expect(mockWreckGet).toHaveBeenCalledTimes(1)
    expect(results).toEqual([mockOidcPayload, mockOidcPayload, mockOidcPayload])
  })

  test('Should propagate error to all concurrent callers on failure', async () => {
    mockWreckGet.mockRejectedValue(new Error('Network error'))

    const results = await Promise.allSettled([
      getOidcConfig(),
      getOidcConfig(),
      getOidcConfig()
    ])

    expect(mockWreckGet).toHaveBeenCalledTimes(1)
    expect(results.every((r) => r.status === 'rejected')).toBe(true)
  })
})
