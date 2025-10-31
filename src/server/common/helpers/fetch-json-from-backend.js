import Wreck from '@hapi/wreck'
import { config } from '#config/config.js'
import { getUserSession } from './auth/get-user-session.js'
import { handleApiResponse } from './handle-api-response.js'

/**
 * Fetch JSON from a given path in the backend service.
 * @param {import('@hapi/hapi').Request} request
 * @param {string} url
 * @param {Wreck.options} options
 * @returns {Promise<{res: *, error}|{res: *, payload: *}>}
 */
export const fetchJsonFromBackend = async (request, path, options) => {
  const eprBackendUrl = config.get('eprBackendUrl')
  const userSession = await getUserSession(request)

  const method = (options?.method || 'get').toLowerCase()

  const completeOptions = {
    ...options,
    json: true,
    headers: {
      ...options?.headers,
      Authorization: `Bearer ${userSession?.token}`,
      'Content-Type': 'application/json'
    }
  }

  const { res, payload } = await Wreck[method](
    `${eprBackendUrl}${path}`,
    completeOptions
  )

  return handleApiResponse({ res, payload })
}
