import { Readable } from 'node:stream'

import { vi, describe, it, expect, beforeEach } from 'vitest'

import { wasteRecordsRegistrationDownloadController } from './controller.registration-download.js'
import { streamFromBackend } from '#server/common/helpers/stream-from-backend.js'

vi.mock('#server/common/helpers/stream-from-backend.js', () => ({
  streamFromBackend: vi.fn()
}))

const { mockLoggerError } = vi.hoisted(() => ({ mockLoggerError: vi.fn() }))
vi.mock('#server/common/helpers/logging/logger.js', () => ({
  createLogger: () => ({ error: mockLoggerError })
}))

const buildWebStream = (chunks) =>
  new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(new TextEncoder().encode(chunk))
      }
      controller.close()
    }
  })

const buildHapiH = () => {
  const responseBuilder = {
    type: vi.fn().mockReturnThis(),
    header: vi.fn().mockReturnThis()
  }
  const h = {
    response: vi.fn().mockReturnValue(responseBuilder),
    redirect: vi.fn().mockReturnValue('redirect-response')
  }
  return { h, responseBuilder }
}

const buildRequest = () =>
  /** @type {any} */ ({
    params: { organisationId: 'org-1', registrationId: 'reg-1' },
    yar: { set: vi.fn() }
  })

describe('wasteRecordsRegistrationDownloadController', () => {
  beforeEach(() => vi.clearAllMocks())

  it('streams the export scoped to the organisation and registration', async () => {
    vi.mocked(streamFromBackend).mockResolvedValue(
      /** @type {any} */ ({
        body: buildWebStream(['header\n']),
        headers: new Headers({ 'content-type': 'text/csv; charset=utf-8' })
      })
    )

    const { h } = buildHapiH()
    const request = buildRequest()

    await wasteRecordsRegistrationDownloadController.handler(request, h)

    expect(streamFromBackend).toHaveBeenCalledWith(
      request,
      '/v1/admin/waste-records/export.csv?organisationId=org-1&registrationId=reg-1'
    )
    expect(h.response.mock.calls[0][0]).toBeInstanceOf(Readable)
  })

  it('redirects back to the registration overview with a flash error on failure', async () => {
    const error = new Error('boom')
    vi.mocked(streamFromBackend).mockRejectedValue(error)

    const { h } = buildHapiH()
    const request = buildRequest()

    const result = await wasteRecordsRegistrationDownloadController.handler(
      request,
      h
    )

    expect(mockLoggerError).toHaveBeenCalledWith({
      message: 'Failed to stream waste records export for registration',
      err: error
    })
    expect(request.yar.set).toHaveBeenCalledWith('error', expect.any(String))
    expect(h.redirect).toHaveBeenCalledWith(
      '/organisations/org-1/registrations/reg-1/overview'
    )
    expect(result).toBe('redirect-response')
  })

  it('uses the Boom payload message when available', async () => {
    const error = /** @type {any} */ (new Error('upstream'))
    error.output = { payload: { message: 'Backend exploded' } }
    vi.mocked(streamFromBackend).mockRejectedValue(error)

    const { h } = buildHapiH()
    const request = buildRequest()

    await wasteRecordsRegistrationDownloadController.handler(request, h)

    expect(request.yar.set).toHaveBeenCalledWith('error', 'Backend exploded')
  })
})
