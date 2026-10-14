import { config } from '#config/config.js'
import { http, HttpResponse, server } from '#vite/setup-msw.js'

describe('msw setup', () => {
  const backendUrl = `${config.get('eprBackendUrl')}/v1/canary`

  it('should pass a test whose request has an msw handler', async () => {
    server.use(
      http.get(backendUrl, () => new HttpResponse(null, { status: 204 }))
    )

    const response = await fetch(backendUrl)

    expect(response.status).toBe(204)
  })

  it.fails(
    'should fail a test whose request has no msw handler, even when the rejection is handled',
    async () => {
      await expect(fetch(backendUrl)).rejects.toThrow('fetch failed')
    }
  )
})
