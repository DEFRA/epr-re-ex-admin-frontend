import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { statusCodes } from '#server/common/constants/status-codes.js'

const GENERIC_FAILURE_REASON =
  'There was a problem cancelling the PRN. Please try again.'

/**
 * The backend returns a specific, human-readable message for both refusal
 * cases it can produce (wrong status, past the cancellation deadline) as a
 * 409 Conflict — surface it verbatim. Any other failure (5xx, network) falls
 * back to a generic message. `fetchJsonFromBackend` always throws a Boom
 * error (it re-throws Boom as-is, wraps anything else), so `error.output` is
 * always present here.
 * @param {*} error
 */
const failureReason = (error) => {
  const { statusCode, payload } = error.output
  return statusCode < statusCodes.internalServerError && payload?.message
    ? payload.message
    : GENERIC_FAILURE_REASON
}

export const prnCancelPostController = {
  async handler(request, h) {
    const { prnId } = request.params
    const {
      prnNumber,
      organisationName,
      issuedTo,
      tonnage,
      material,
      accreditationNumber,
      accreditationYear
    } = request.payload

    const displayFields = {
      prnNumber,
      organisationName,
      issuedTo,
      tonnage,
      material,
      accreditationNumber,
      accreditationYear
    }

    try {
      await fetchJsonFromBackend(
        request,
        `/v1/admin/packaging-recycling-notes/${prnId}/cancel`,
        { method: 'POST' }
      )

      return h.view('routes/prn-cancel/result', {
        pageTitle: 'Cancel PRN',
        success: true,
        overviewUrl: '/prn-activity',
        ...displayFields
      })
    } catch (error) {
      request.logger.error({ err: error, message: 'Cancel PRN failed' })

      return h.view('routes/prn-cancel/result', {
        pageTitle: 'Cancel PRN',
        success: false,
        reason: failureReason(error),
        overviewUrl: '/prn-activity',
        ...displayFields
      })
    }
  }
}
