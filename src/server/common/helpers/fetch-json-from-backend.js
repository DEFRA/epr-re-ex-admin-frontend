import { config } from '#config/config.js'
import { statusCodes } from '#server/common/constants/status-codes.js'
import { createLogger } from './logging/logger.js'
import { getUserSession } from './auth/get-user-session.js'

export const fetchJsonFromBackend = async (request, path, options) => {
  const logger = createLogger()
  const eprBackendUrl = config.get('eprBackendUrl')
  const userSession = await getUserSession(request)

  const completeOptions = {
    ...options,
    headers: {
      ...options?.headers,
      Authorization: `Bearer ${userSession?.token}`
    }
  }

  let apiResponse
  try {
    apiResponse = await fetch(`${eprBackendUrl}${path}`, completeOptions)
  } catch (error) {
    logger.error(
      `Failed to fetch from backend at path: ${path}: ${error.message}`
    )

    return { errorView: '500' }
  }

  if (!apiResponse.ok) {
    if (apiResponse.status === statusCodes.unauthorised) {
      return { errorView: 'unauthorised' }
    }

    logger.error(
      `Failed to fetch from backend at path: ${path}: ${apiResponse.status} ${apiResponse.statusText}`
    )

    return { errorView: '500' }
  }

  const data = await apiResponse.json()

  return { data }
}
