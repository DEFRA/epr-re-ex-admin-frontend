import Boom from '@hapi/boom'
import { config } from '#config/config.js'
import { errorCodes } from '#server/common/enums/error-codes.js'
import { classifierTail, internal } from './logging/cdp-boom.js'
import { getUserSession } from './auth/get-user-session.js'
import { withTraceId } from '@defra/hapi-tracing'
import { getTracingHeaderName } from './request-tracing.js'

/**
 * @import { HapiRequest } from '#server/common/hapi-types.js'
 */

/**
 * Streaming counterpart to fetchJsonFromBackend — returns the raw fetch
 * Response so the caller can pass `response.body` straight through to
 * `h.response(body)` for chunked download proxying.
 *
 * @param {HapiRequest} request
 * @param {string} path
 * @param {RequestInit} [options]
 * @returns {Promise<Response>}
 */
export const streamFromBackend = async (request, path, options) => {
  const eprBackendUrl = config.get('eprBackendUrl')
  const userSession = await getUserSession(request)

  const completeOptions = {
    ...options,
    headers: withTraceId(getTracingHeaderName(), {
      ...options?.headers,
      Authorization: `Bearer ${userSession?.token}`,
      Accept: 'text/csv'
    })
  }

  const url = `${eprBackendUrl}${path}`

  try {
    const response = await fetch(url, completeOptions)

    if (!response.ok) {
      throw Boom.boomify(
        new Error(
          `Failed to stream from backend at url: ${url}: ${response.status} ${response.statusText}`
        ),
        { statusCode: response.status }
      )
    }

    return response
  } catch (error) {
    if (error.isBoom) {
      throw error
    }

    throw internal(
      `Failed to stream from backend at url: ${url}`,
      errorCodes.externalFetchFailed,
      {
        event: { action: 'external_fetch', reason: classifierTail(error) },
        cause: error
      }
    )
  }
}
