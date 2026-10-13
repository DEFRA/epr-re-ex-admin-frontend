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

let unhandledFrames = 0

beforeAll(() => {
  server.listen({
    onUnhandledFrame: ({ defaults }) => {
      unhandledFrames++
      defaults.error()
    }
  })
})

afterEach(() => {
  server.resetHandlers()

  const count = unhandledFrames
  unhandledFrames = 0

  if (count > 0) {
    throw new Error(
      `${count} request(s) had no msw handler, see the [MSW] errors above`
    )
  }
})

afterAll(() => {
  server.close()
})
