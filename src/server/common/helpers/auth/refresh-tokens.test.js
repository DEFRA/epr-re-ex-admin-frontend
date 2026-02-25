import { vi, beforeEach, afterEach, describe, test, expect } from 'vitest'

const mockDiscovery = vi.fn()
const mockRefreshTokenGrant = vi.fn()
const mockGetScopesForAuth = vi.fn()

vi.mock('openid-client', () => ({
  discovery: (...args) => mockDiscovery(...args),
  refreshTokenGrant: (...args) => mockRefreshTokenGrant(...args)
}))

vi.mock('./get-scopes-for-auth.js', () => ({
  getScopesForAuth: (...args) => mockGetScopesForAuth(...args)
}))

const ONE_HOUR_MS = 60 * 60 * 1000

// Dynamic import so we get a fresh module (and cache state) for each test
let refreshTokens

async function importFreshModule() {
  const mod = await import('./refresh-tokens.js')
  refreshTokens = mod.refreshTokens
}

describe('#refreshTokens', () => {
  const mockOpenIdConfig = {
    serverMetadata: () => ({ issuer: 'https://test' })
  }
  const mockTokenResponse = {
    access_token: 'new-access-token',
    refresh_token: 'new-refresh-token'
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    vi.useFakeTimers()

    mockDiscovery.mockResolvedValue(mockOpenIdConfig)
    mockRefreshTokenGrant.mockResolvedValue(mockTokenResponse)
    mockGetScopesForAuth.mockReturnValue([
      'openid',
      'profile',
      'offline_access'
    ])

    await importFreshModule()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.resetAllMocks()
  })

  test('Should call openid.discovery with correct parameters', async () => {
    await refreshTokens('refresh-token-123')

    expect(mockDiscovery).toHaveBeenCalledTimes(1)
    expect(mockDiscovery).toHaveBeenCalledWith(
      expect.any(URL),
      expect.any(String),
      expect.any(String)
    )
  })

  test('Should call refreshTokenGrant with correct parameters', async () => {
    await refreshTokens('refresh-token-123')

    expect(mockRefreshTokenGrant).toHaveBeenCalledWith(
      mockOpenIdConfig,
      'refresh-token-123',
      { scope: 'openid profile offline_access' }
    )
  })

  test('Should return token response', async () => {
    const result = await refreshTokens('refresh-token-123')

    expect(result).toEqual(mockTokenResponse)
  })

  test('Should cache openid.discovery result on subsequent calls', async () => {
    await refreshTokens('token-1')
    await refreshTokens('token-2')
    await refreshTokens('token-3')

    expect(mockDiscovery).toHaveBeenCalledTimes(1)
    expect(mockRefreshTokenGrant).toHaveBeenCalledTimes(3)
  })

  test('Should re-fetch discovery config after TTL expires', async () => {
    await refreshTokens('token-1')

    expect(mockDiscovery).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(ONE_HOUR_MS + 1)

    await refreshTokens('token-2')

    expect(mockDiscovery).toHaveBeenCalledTimes(2)
  })

  test('Should not re-fetch discovery config just before TTL expires', async () => {
    await refreshTokens('token-1')

    vi.advanceTimersByTime(ONE_HOUR_MS - 1)

    await refreshTokens('token-2')

    expect(mockDiscovery).toHaveBeenCalledTimes(1)
  })

  test('Should propagate discovery errors', async () => {
    mockDiscovery.mockRejectedValue(new Error('Discovery failed'))

    await expect(refreshTokens('token-1')).rejects.toThrow('Discovery failed')
  })

  test('Should not cache failed discovery calls', async () => {
    mockDiscovery.mockRejectedValueOnce(new Error('Discovery failed'))
    mockDiscovery.mockResolvedValueOnce(mockOpenIdConfig)

    await expect(refreshTokens('token-1')).rejects.toThrow('Discovery failed')

    await refreshTokens('token-2')

    expect(mockDiscovery).toHaveBeenCalledTimes(2)
    expect(mockRefreshTokenGrant).toHaveBeenCalledTimes(1)
  })

  test('Should propagate refreshTokenGrant errors', async () => {
    mockRefreshTokenGrant.mockRejectedValue(new Error('Refresh failed'))

    await expect(refreshTokens('token-1')).rejects.toThrow('Refresh failed')
  })

  test('Should handle concurrent calls with a single discovery fetch', async () => {
    const results = await Promise.all([
      refreshTokens('token-1'),
      refreshTokens('token-2'),
      refreshTokens('token-3')
    ])

    expect(mockDiscovery).toHaveBeenCalledTimes(1)
    expect(mockRefreshTokenGrant).toHaveBeenCalledTimes(3)
    expect(results).toEqual([
      mockTokenResponse,
      mockTokenResponse,
      mockTokenResponse
    ])
  })

  test('Should propagate discovery error to all concurrent callers on failure', async () => {
    mockDiscovery.mockRejectedValue(new Error('Discovery failed'))

    const results = await Promise.allSettled([
      refreshTokens('token-1'),
      refreshTokens('token-2'),
      refreshTokens('token-3')
    ])

    expect(mockDiscovery).toHaveBeenCalledTimes(1)
    expect(results.every((r) => r.status === 'rejected')).toBe(true)
  })
})
