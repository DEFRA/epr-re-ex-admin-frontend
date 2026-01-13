import {
  vi,
  describe,
  test,
  beforeAll,
  afterAll,
  beforeEach,
  expect
} from 'vitest'

import { fetchJsonFromBackend } from './fetch-json-from-backend.js'
import { config } from '#config/config.js'
import { getUserSession } from '#server/common/helpers/auth/get-user-session.js'
import { mockUserSession } from '#server/common/test-helpers/fixtures.js'
import {
  http,
  HttpResponse,
  server as mswServer
} from '../../../../.vite/setup-msw.js'

vi.mock('#server/common/helpers/auth/get-user-session.js', () => ({
  getUserSession: vi.fn().mockReturnValue(null)
}))

vi.mock(import('@defra/hapi-tracing'), () => ({
  withTraceId: vi.fn((headerName, headers = {}) => {
    headers[headerName] = 'mock-trace-id-1'
    return headers
  })
}))

describe('#fetchJsonFromBackend', () => {
  const originalBackendUrl = config.get('eprBackendUrl')
  const backendUrl = 'http://mock-backend'
  getUserSession.mockReturnValue(mockUserSession)

  beforeAll(() => {
    config.set('eprBackendUrl', backendUrl)
  })

  afterAll(() => {
    config.set('eprBackendUrl', originalBackendUrl)
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('on a successful response', () => {
    test('returns data when backend responds with ok=true', async () => {
      const mockOrganisations = [
        {
          orgId: 'org-2',
          statusHistory: [],
          companyDetails: {
            name: 'Beta Corp',
            registrationNumber: '87654321'
          }
        }
      ]

      const url = `${backendUrl}/v1/organisations`
      const getOrganisationsHandler = http.get(url, () => {
        return HttpResponse.json(mockOrganisations)
      })
      mswServer.use(getOrganisationsHandler)

      const options = {
        method: 'GET',
        headers: {
          'x-test': '1'
        }
      }

      const result = await fetchJsonFromBackend(
        {},
        '/v1/organisations',
        options
      )

      expect(result).toEqual(mockOrganisations)
    })

    test('adds the authorisation header with the user token', async () => {
      let capturedHeaders = null

      const url = `${backendUrl}/v1/organisations`
      const getOrganisationsHandler = http.get(url, ({ request }) => {
        capturedHeaders = Object.fromEntries(request.headers.entries())
        return HttpResponse.json([])
      })
      mswServer.use(getOrganisationsHandler)

      await fetchJsonFromBackend({}, '/v1/organisations', { method: 'GET' })

      expect(capturedHeaders).toEqual(
        expect.objectContaining({
          authorization: `Bearer ${mockUserSession.token}`,
          'content-type': 'application/json'
        })
      )
    })
  })

  test('throws Boom unauthorised error when status is 401', async () => {
    const url = `${backendUrl}/secure`
    const unauthorisedHandler = http.get(url, () => {
      return new HttpResponse(null, {
        status: 401,
        statusText: 'Unauthorized'
      })
    })
    mswServer.use(unauthorisedHandler)

    await expect(
      fetchJsonFromBackend({}, '/secure', { method: 'GET' })
    ).rejects.toMatchObject({
      isBoom: true,
      output: {
        statusCode: 401
      },
      message: expect.stringContaining(
        `Failed to fetch from backend at url: ${backendUrl}/secure: 401 Unauthorized`
      )
    })
  })

  test('throws Boom internal server error when response not ok (non-401)', async () => {
    const path = '/boom'
    const url = `${backendUrl}${path}`
    const errorHandler = http.get(url, () => {
      return new HttpResponse(null, {
        status: 500,
        statusText: 'Internal Server Error'
      })
    })
    mswServer.use(errorHandler)

    await expect(
      fetchJsonFromBackend({}, path, { method: 'GET' })
    ).rejects.toMatchObject({
      isBoom: true,
      output: {
        statusCode: 500
      },
      message: expect.stringContaining(
        `Failed to fetch from backend at url: ${backendUrl}/boom: 500 Internal Server Error`
      )
    })
  })

  test('throws Boom internal server error when fetch throws', async () => {
    const path = '/network'
    const url = `${backendUrl}${path}`
    const networkErrorHandler = http.get(url, () => {
      return HttpResponse.error()
    })
    mswServer.use(networkErrorHandler)

    await expect(
      fetchJsonFromBackend({}, path, { method: 'GET' })
    ).rejects.toMatchObject({
      isBoom: true,
      output: {
        statusCode: 500
      },
      message: expect.stringContaining(
        `Failed to fetch from backend at url: ${backendUrl}/network:`
      )
    })
  })

  test('includes JSON payload in Boom error when backend returns error with JSON body', async () => {
    const path = '/validation-error'
    const url = `${backendUrl}${path}`
    const errorPayload = {
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed',
      validation: {
        source: 'payload',
        keys: ['email', 'password']
      }
    }

    const errorHandler = http.get(url, () => {
      return HttpResponse.json(errorPayload, {
        status: 400,
        statusText: 'Bad Request'
      })
    })
    mswServer.use(errorHandler)

    await expect(
      fetchJsonFromBackend({}, path, { method: 'GET' })
    ).rejects.toMatchObject({
      isBoom: true,
      output: {
        statusCode: 400,
        payload: errorPayload
      },
      message: expect.stringContaining(
        `Failed to fetch from backend at url: ${backendUrl}/validation-error: 400 Bad Request`
      )
    })
  })

  test('handles malformed JSON in error response gracefully', async () => {
    const path = '/malformed'
    const url = `${backendUrl}${path}`

    const errorHandler = http.get(url, () => {
      return new HttpResponse('this is not valid JSON', {
        status: 500,
        statusText: 'Internal Server Error',
        headers: {
          'content-type': 'application/json'
        }
      })
    })
    mswServer.use(errorHandler)

    await expect(
      fetchJsonFromBackend({}, path, { method: 'GET' })
    ).rejects.toMatchObject({
      isBoom: true,
      output: {
        statusCode: 500
      },
      message: expect.stringContaining(
        `Failed to fetch from backend at url: ${backendUrl}/malformed:`
      )
    })
  })

  test('propagate trace Id when it exists', async () => {
    let capturedHeaders = {}

    const path = `/v1/organisations`
    const url = `${backendUrl}${path}`
    const handler = http.get(url, ({ request }) => {
      capturedHeaders = Object.fromEntries(request.headers.entries())
      return HttpResponse.json({ id: '695bdf3b816ba41066e4eaff' })
    })
    mswServer.use(handler)

    await fetchJsonFromBackend({}, path, { method: 'GET' })

    expect(capturedHeaders['x-cdp-request-id']).toBe('mock-trace-id-1')
  })
})
