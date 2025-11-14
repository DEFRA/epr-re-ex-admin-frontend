import Boom from '@hapi/boom'
import { config } from '#config/config.js'
import { getUserSession } from './auth/get-user-session.js'

/**
 * Fetch JSON from a given path in the backend service.
 * @param {import('@hapi/hapi').Request} request - The Hapi request object
 * @param {string} path - The API path to append to the backend URL
 * @param {RequestInit} options - Fetch API options (method, headers, body, etc.)
 * @returns {Promise<*>} The parsed JSON response or throws a Boom error
 */
export const fetchJsonFromBackend = async (request, path, options) => {
  const eprBackendUrl = config.get('eprBackendUrl')
  const userSession = await getUserSession(request)

  const completeOptions = {
    ...options,
    headers: {
      ...options?.headers,
      Authorization: `Bearer ${userSession?.token}`,
      'Content-Type': 'application/json'
    }
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

    // For network errors or other non-HTTP errors, create a 500 Boom error
    throw Boom.internal(
      `Failed to fetch from backend at url: ${url}: ${error.message}`
    )
  }
}
