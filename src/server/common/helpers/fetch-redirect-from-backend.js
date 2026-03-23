import Boom from '@hapi/boom'
import { config } from '#config/config.js'
import { getUserSession } from './auth/get-user-session.js'
import { withTraceId } from '@defra/hapi-tracing'
import { getTracingHeaderName } from './request-tracing.js'

/**
 * Fetch a redirect response from the backend without following it.
 * Returns the Location header URL from the redirect response.
 * @param {import('@hapi/hapi').Request} request - The Hapi request object
 * @param {string} path - The API path to append to the backend URL
 * @returns {Promise<string>} The redirect Location URL
 */
export const fetchRedirectFromBackend = async (request, path) => {
  const eprBackendUrl = config.get('eprBackendUrl')
  const userSession = await getUserSession(request)

  const url = `${eprBackendUrl}${path}`

  try {
    const response = await fetch(url, {
      redirect: 'manual',
      headers: withTraceId(getTracingHeaderName(), {
        Authorization: `Bearer ${userSession?.token}`
      })
    })

    const location = response.headers.get('location')

    if (!location) {
      throw Boom.badGateway(`Backend did not return a redirect for: ${url}`)
    }

    return location
  } catch (error) {
    if (error.isBoom) {
      throw error
    }

    throw Boom.internal(
      `Failed to fetch redirect from backend at url: ${url}: ${error.message}`
    )
  }
}
