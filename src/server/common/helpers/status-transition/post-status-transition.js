import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { statusCodes } from '#server/common/constants/status-codes.js'

/**
 * @typedef {object} StatusTransitionErrorCopy
 * @property {string} errorMessage - Flash fallback when the backend gives no message
 * @property {string} logMessage
 */

/**
 * Posts a confirm-page body to the backend and reports how the failure should
 * surface. Shared between accreditation-status-transition,
 * registration-status-transition and accreditation-assign — only the backend
 * URL and the caller's own error copy differ; the request/response handling is
 * identical.
 *
 * Returns `null` on success, or when a 5xx/network failure has already been
 * flashed on the request's session (the caller redirects to the overview
 * either way). Returns `{ backendError }` when a client-side (4xx) rejection
 * of the submitted fields should instead re-render the confirm page,
 * preserving what the admin entered.
 * @param {string} statusHistoryUrl
 * @param {Record<string, string | undefined>} body
 * @param {StatusTransitionErrorCopy} transition
 * @param {Record<string, string> | undefined} grantValues - Parsed form
 *   values, present only when the confirm page collects them; used to decide
 *   whether a 4xx rejection re-renders the confirm page
 * @returns {Promise<{ backendError: string } | null>}
 */
export const postStatusTransition = async (
  request,
  statusHistoryUrl,
  body,
  transition,
  grantValues
) => {
  try {
    await fetchJsonFromBackend(request, statusHistoryUrl, {
      method: 'POST',
      body: JSON.stringify(body)
    })
    return null
  } catch (error) {
    request.logger.error({
      err: error,
      message: transition.logMessage
    })

    // Only surface backend messages for client errors: 5xx and network
    // failures carry Boom's generic message (or the raw fetch error, which
    // leaks the backend URL), so those get the friendly fallback instead.
    const { statusCode, payload } = error.output
    const errorMessage =
      (statusCode < statusCodes.internalServerError && payload?.message) ||
      transition.errorMessage

    // A backend rejection of the grant fields re-renders the confirm page
    // so the admin keeps what they typed; 5xx and network failures still
    // flash on the overview, where retrying immediately won't help.
    if (grantValues && statusCode < statusCodes.internalServerError) {
      return { backendError: errorMessage }
    }

    request.yar.set('error', errorMessage)
    return null
  }
}
