import { describe, test, beforeAll, afterAll, expect } from 'vitest'

import { fetchAdminMe } from './fetch-admin-me.js'
import { config } from '#config/config.js'
import { http, HttpResponse, server as mswServer } from '#vite/setup-msw.js'

describe('#fetchAdminMe', () => {
  const originalBackendUrl = config.get('eprBackendUrl')
  const backendUrl = 'http://mock-backend'
  const adminMeUrl = `${backendUrl}/v1/admin/me`

  beforeAll(() => {
    config.set('eprBackendUrl', backendUrl)
  })

  afterAll(() => {
    config.set('eprBackendUrl', originalBackendUrl)
  })

  test('calls /v1/admin/me with the bearer token and returns the parsed JSON', async () => {
    const expected = {
      scopes: ['admin.read', 'admin.write', 'admin.dlq.purge']
    }

    let capturedAuth = null
    mswServer.use(
      http.get(adminMeUrl, ({ request }) => {
        capturedAuth = request.headers.get('authorization')
        return HttpResponse.json(expected)
      })
    )

    const result = await fetchAdminMe('access-token-abc')

    expect(capturedAuth).toBe('Bearer access-token-abc')
    expect(result).toEqual(expected)
  })

  test('throws an Error tagged with the response status on non-200', async () => {
    mswServer.use(
      http.get(adminMeUrl, () => {
        return new HttpResponse(null, { status: 403, statusText: 'Forbidden' })
      })
    )

    await expect(fetchAdminMe('token')).rejects.toMatchObject({
      message: expect.stringContaining('GET /v1/admin/me failed: 403'),
      statusCode: 403
    })
  })

  test('propagates the underlying fetch error', async () => {
    mswServer.use(http.get(adminMeUrl, () => HttpResponse.error()))

    await expect(fetchAdminMe('token')).rejects.toThrow()
  })
})
