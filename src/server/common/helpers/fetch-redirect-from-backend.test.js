import { vi } from 'vitest'
import Boom from '@hapi/boom'
import { fetchRedirectFromBackend } from './fetch-redirect-from-backend.js'
import { getUserSession } from './auth/get-user-session.js'

vi.mock('./auth/get-user-session.js', () => ({
  getUserSession: vi.fn()
}))

describe('fetchRedirectFromBackend', () => {
  const mockToken = 'test-token'
  const mockRequest = {}

  beforeEach(() => {
    vi.clearAllMocks()
    getUserSession.mockResolvedValue({ token: mockToken })
  })

  test('returns the Location header from a redirect response', async () => {
    const expectedUrl = 'https://s3.amazonaws.com/bucket/file.xlsx?signed=abc'

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, {
        status: 307,
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
        status: 307,
        headers: { Location: 'https://example.com' }
      })
    )

    await fetchRedirectFromBackend(mockRequest, '/v1/test/download')

    const [, options] = fetchSpy.mock.calls[0]
    expect(options.headers.Authorization).toBe(`Bearer ${mockToken}`)
  })

  test('uses redirect manual to prevent following the redirect', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, {
        status: 307,
        headers: { Location: 'https://example.com' }
      })
    )

    await fetchRedirectFromBackend(mockRequest, '/v1/test/download')

    const [, options] = fetchSpy.mock.calls[0]
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
    ).rejects.toThrow(/Network failure/)
  })

  test('re-throws Boom errors without wrapping', async () => {
    const boomError = Boom.notFound('Not found')
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(boomError)

    await expect(
      fetchRedirectFromBackend(mockRequest, '/v1/test/download')
    ).rejects.toBe(boomError)
  })
})
