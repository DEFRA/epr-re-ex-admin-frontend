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
 * Fetch JSON from a given path in the backend service.
 * @param {HapiRequest} request
 * @param {string} path
 * @param {RequestInit} [options]
 * @returns {Promise<*>}
 */
export const fetchJsonFromBackend = async (request, path, options) => {
  const eprBackendUrl = config.get('eprBackendUrl')
  const userSession = await getUserSession(request)

  const completeOptions = {
    ...options,
    headers: withTraceId(getTracingHeaderName(), {
      ...options?.headers,
      Authorization: `Bearer ${userSession?.token}`,
      'Content-Type': 'application/json'
    })
  }

  const url = `${eprBackendUrl}${path}`

  try {
    const response = await fetch(url, completeOptions)

    if (!response.ok) {
      // Create a Boom error that matches the backend response
      const error = Boom.boomify(
        new Error(
          `Failed to fetch from backend at url: ${url}: ${response.status} ${response.statusText}`
        ),
        { statusCode: response.status }
      )

      // Add response body to the error payload if needed
      if (response.headers.get('content-type')?.includes('application/json')) {
        error.output.payload = await response.json()
      }

      throw error
    }

    return await response.json()
  } catch (error) {
    // If it's already a Boom error, re-throw it
    if (error.isBoom) {
      throw error
    }

    throw internal(
      `Failed to fetch from backend at url: ${url}`,
      errorCodes.externalFetchFailed,
      {
        event: {
          action: 'external_fetch',
          reason: classifierTail(error)
        }
      }
    )
  }
}
