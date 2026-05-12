import { vi } from 'vitest'
import Boom from '@hapi/boom'
import { fetchRedirectFromBackend } from './fetch-redirect-from-backend.js'
import * as getUserSessionMod from './auth/get-user-session.js'

/**
 * @import { Request } from '@hapi/hapi'
 */

vi.mock('./auth/get-user-session.js')

const { getUserSession } = vi.mocked(getUserSessionMod)

describe('fetchRedirectFromBackend', () => {
  const mockToken = 'test-token'
  const mockRequest = /** @type {Request} */ (/** @type {unknown} */ ({}))

  beforeEach(() => {
    vi.clearAllMocks()
    getUserSession.mockResolvedValue({ token: mockToken })
  })

  test('returns the Location header from a redirect response', async () => {
    const expectedUrl = 'https://s3.amazonaws.com/bucket/file.xlsx?signed=abc'

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: { Location: expectedUrl }
      })
    )

    const result = await fetchRedirectFromBackend(
      mockRequest,
      '/v1/test/download'
    )

    expect(result).toBe(expectedUrl)
  })

  test('sends the Authorization header with the user token', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: { Location: 'https://example.com' }
      })
    )

    await fetchRedirectFromBackend(mockRequest, '/v1/test/download')

    const [, options] = /** @type {[string, RequestInit]} */ (
      fetchSpy.mock.calls[0]
    )
    expect(
      /** @type {Record<string, string>} */ (options.headers).Authorization
    ).toBe(`Bearer ${mockToken}`)
  })

  test('uses redirect manual to prevent following the redirect', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: { Location: 'https://example.com' }
      })
    )

    await fetchRedirectFromBackend(mockRequest, '/v1/test/download')

    const [, options] = /** @type {[string, RequestInit]} */ (
      fetchSpy.mock.calls[0]
    )
    expect(options.redirect).toBe('manual')
  })

  test('throws a bad gateway error when no Location header is returned', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 200 })
    )

    await expect(
      fetchRedirectFromBackend(mockRequest, '/v1/test/download')
    ).rejects.toThrow(/did not return a redirect/)
  })

  test('throws an internal error on network failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(
      new Error('Network failure')
    )

    await expect(
      fetchRedirectFromBackend(mockRequest, '/v1/test/download')
    ).rejects.toThrow(/Failed to fetch redirect from backend/)
  })

  test('re-throws Boom errors without wrapping', async () => {
    const boomError = Boom.notFound('Not found')
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(boomError)

    await expect(
      fetchRedirectFromBackend(mockRequest, '/v1/test/download')
    ).rejects.toBe(boomError)
  })
})
