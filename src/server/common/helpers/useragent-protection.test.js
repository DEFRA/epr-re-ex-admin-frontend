import { describe, beforeEach, afterEach, test, expect } from 'vitest'
import http2 from 'node:http2'
import { createServer } from '#server/server.js'
import { createMockOidcServer } from '#server/common/test-helpers/mock-oidc.js'

const { constants: httpConstants } = http2
const MAX_USER_AGENT_LENGTH = 150

describe('user-agent protection', () => {
  let server

  beforeEach(async () => {
    createMockOidcServer()
    server = await createServer()
    await server.initialize()
  })

  afterEach(async () => {
    if (server) {
      await server.stop()
    }
  })

  test('should allow normal User-Agent strings', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/',
      headers: {
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_OK)
  })

  test('should handle requests without User-Agent header', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/'
    })

    expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_OK)
  })

  test('should verify actual header truncation by inspecting processed request', async () => {
    const originalUserAgent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 EdgeCustomLongName/SuperLongVersionString'
    /** @type {string | undefined} */
    let capturedUserAgent

    server.route({
      method: 'GET',
      path: '/test-truncation',
      options: {
        auth: false
      },
      handler: (request, h) => {
        capturedUserAgent = request.headers['user-agent']
        return h.response('OK').code(httpConstants.HTTP_STATUS_OK)
      }
    })

    const response = await server.inject({
      method: 'GET',
      url: '/test-truncation',
      headers: {
        'user-agent': originalUserAgent
      }
    })

    expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_OK)
    expect(originalUserAgent.length).toBeGreaterThan(MAX_USER_AGENT_LENGTH)
    expect(capturedUserAgent).toHaveLength(MAX_USER_AGENT_LENGTH)
    expect(capturedUserAgent).toBe(
      originalUserAgent.substring(0, MAX_USER_AGENT_LENGTH)
    )
    expect(originalUserAgent.startsWith(capturedUserAgent ?? '')).toBe(true)
  })

  test('should not modify User-Agent headers that are already within limit', async () => {
    const normalUserAgent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    /** @type {string | undefined} */
    let capturedUserAgent

    server.route({
      method: 'GET',
      path: '/test-no-truncation',
      options: {
        auth: false
      },
      handler: (request, h) => {
        capturedUserAgent = request.headers['user-agent']
        return h.response('OK').code(httpConstants.HTTP_STATUS_OK)
      }
    })

    const response = await server.inject({
      method: 'GET',
      url: '/test-no-truncation',
      headers: {
        'user-agent': normalUserAgent
      }
    })

    expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_OK)
    expect(normalUserAgent.length).toBeLessThanOrEqual(MAX_USER_AGENT_LENGTH)
    expect(capturedUserAgent).toBe(normalUserAgent)
  })
})
