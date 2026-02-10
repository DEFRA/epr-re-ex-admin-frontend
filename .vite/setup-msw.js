import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { beforeAll, afterEach, afterAll } from 'vitest'

export { http, HttpResponse, delay } from 'msw'

const awsImdsBaseUrl = 'http://169.254.169.254'

export const handlers = [
  http.put(`${awsImdsBaseUrl}/latest/api/token`, () =>
    HttpResponse.text('mock-imds-token')
  ),
  http.get(`${awsImdsBaseUrl}/latest/dynamic/instance-identity/document`, () =>
    HttpResponse.json({ region: 'eu-west-2' })
  )
]

export const server = setupServer(...handlers)

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' })
})

afterEach(() => {
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})
