import { statusCodes } from '#server/common/constants/status-codes.js'

/**
 * Handles backend errors and returns appropriate views.
 *
 * Note: We won't want to expose 403 or 404 from backend services to users,
 * so those cases are not handled here. Instead, they're handled
 * as 500's or in specific controllers if needed.
 *
 * @param h
 * @param response
 * @returns {Promise<*>}
 */
export const handleBackendError = async (h, response) => {
  if (response.status === statusCodes.unauthorised) {
    return h.view('unauthorised')
  }

  if (!response?.ok) {
    return h.view('500')
  }
}
