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

const mockLoggerError = vi.fn()

vi.mock('./logging/logger.js', () => ({
  createLogger: () => ({ error: (...args) => mockLoggerError(...args) })
}))

vi.mock('#server/common/helpers/auth/get-user-session.js', () => ({
  getUserSession: vi.fn().mockReturnValue(null)
}))

describe('#fetchJsonFromBackend', () => {
  const originalFetch = globalThis.fetch
  const originalBackendUrl = config.get('eprBackendUrl')
  const backendUrl = 'http://mock-backend'
  getUserSession.mockReturnValue(mockUserSession)

  beforeAll(() => {
    config.set('eprBackendUrl', backendUrl)
  })

  afterAll(() => {
    config.set('eprBackendUrl', originalBackendUrl)
    globalThis.fetch = originalFetch
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test.only('returns data when backend responds with ok=true', async () => {
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

    const options = {
      method: 'GET',
      headers: {
        'x-test': '1'
      }
    }

    const url = 'http://localhost:3001/v1/organisations'

    const getOrganisationsHandler = http.get(url, () => {
      return HttpResponse.json(mockOrganisations)
    })

    mswServer.use(getOrganisationsHandler)
    const requestSpy = vi.fn()
    mswServer.events.on('request:start', requestSpy)

    const result = await fetchJsonFromBackend({}, '/v1/organisations', options)

    expect(requestSpy).toHaveBeenCalledTimes(1)
    expect(requestSpy()).toHaveBeenCalledWith(
      `${backendUrl}/test`,
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ 'x-test': '1' })
      })
    )

    expect(result).toEqual({ data: mockOrganisations })
    expect(mockLoggerError).not.toHaveBeenCalled()
  })

  test('adds the authorisation header with the user token', async () => {
    const mockData = { success: true }
    const json = vi.fn().mockResolvedValue(mockData)
    const response = { ok: true, json }

    globalThis.fetch = vi.fn().mockResolvedValue(response)

    await fetchJsonFromBackend({}, '/test', { method: 'GET' })

    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${backendUrl}/test`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${mockUserSession.token}`
        })
      })
    )
  })

  test('returns unauthorised errorView when status is 401', async () => {
    const json = vi.fn()
    const response = {
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json
    }

    globalThis.fetch = vi.fn().mockResolvedValue(response)

    const result = await fetchJsonFromBackend({}, '/secure', { method: 'GET' })

    expect(result).toEqual({ errorView: 'unauthorised' })
    expect(mockLoggerError).not.toHaveBeenCalled()
    expect(json).not.toHaveBeenCalled()
  })

  test('logs error and returns 500 errorView when response not ok (non-401)', async () => {
    const json = vi.fn()
    const response = {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json
    }

    globalThis.fetch = vi.fn().mockResolvedValue(response)

    const path = '/boom'
    const result = await fetchJsonFromBackend({}, path, { method: 'GET' })

    expect(result).toEqual({ errorView: '500' })
    expect(mockLoggerError).toHaveBeenCalledTimes(1)
    expect(mockLoggerError.mock.calls[0][0]).toContain(
      `Failed to fetch from backend at path: ${path}: 500 Internal Server Error`
    )
    expect(json).not.toHaveBeenCalled()
  })

  test('logs error and returns 500 errorView when fetch throws', async () => {
    const path = '/network'
    const err = new Error('network down')

    globalThis.fetch = vi.fn().mockRejectedValue(err)

    const result = await fetchJsonFromBackend({}, path, { method: 'GET' })

    expect(result).toEqual({ errorView: '500' })
    expect(mockLoggerError).toHaveBeenCalledTimes(1)
    expect(mockLoggerError.mock.calls[0][0]).toContain(
      `Failed to fetch from backend at path: ${path}: ${err.message}`
    )
  })
})
