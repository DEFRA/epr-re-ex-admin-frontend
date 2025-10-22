import { config } from '#config/config.js'
import { statusCodes } from '#server/common/constants/status-codes.js'
import { createLogger } from './logging/logger.js'

export const fetchJsonFromBackend = async (path, options) => {
  const logger = createLogger()
  const eprBackendUrl = config.get('eprBackendUrl')

  let response
  try {
    response = await fetch(`${eprBackendUrl}${path}`, options)
  } catch (error) {
    logger.error(
      `Failed to fetch from backend at path: ${path}: ${error.message}`
    )

    return { errorView: '500' }
  }

  if (!response.ok) {
    if (response.status === statusCodes.unauthorised) {
      return { errorView: 'unauthorised' }
    }

    logger.error(
      `Failed to fetch from backend at path: ${path}: ${response.status} ${response.statusText}`
    )

    return { errorView: '500' }
  }

  const data = await response.json()

  return { data }
}
