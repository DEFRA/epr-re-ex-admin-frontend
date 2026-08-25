import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { statusCodes } from '#server/common/constants/status-codes.js'

const GENERIC_FAILURE_REASON =
  'There was a problem cancelling the PRN. Please try again.'

/**
 * The backend's two intended, human-readable refusals for this route — both
 * 409 Conflict, from `routes/admin-cancel.js` (wrong status) and
 * `RelevantYearWindowExpiredError` (past the cancellation deadline). Matched
 * by prefix since neither carries a machine-readable code (unlike ADR-0042's
 * `payload.code`, which exists where a consumer needs to route on it — no
 * consumer does here, so one wasn't added).
 *
 * Anything else reaching this boundary is not written for a user — a Mongo
 * version-conflict message, an internal PRN id, or hapi's own "Not Found"
 * when the feature flag is off — and must never reach the page verbatim.
 * @type {RegExp[]}
 */
const KNOWN_REFUSAL_PREFIXES = [
  /^Cannot cancel a PRN with status /,
  /^The deadline for a \d{4} relevant year was /
]

/**
 * The backend returns a specific, human-readable message for both refusal
 * cases it can produce (wrong status, past the cancellation deadline) as a
 * 409 Conflict — surface it only when it matches one of those known shapes.
 * Any other failure (5xx, network, or an unrecognised 4xx such as a stale
 * version-conflict message or hapi's bare "Not Found") falls back to a
 * generic message, so an internal identifier or document version can never
 * render on this page. `fetchJsonFromBackend` always throws a Boom error (it
 * re-throws Boom as-is, wraps anything else), so `error.output` is always
 * present here.
 * @param {*} error
 */
const failureReason = (error) => {
  const { statusCode, payload } = error.output
  const message = payload?.message
  return statusCode < statusCodes.internalServerError &&
    typeof message === 'string' &&
    KNOWN_REFUSAL_PREFIXES.some((prefix) => prefix.test(message))
    ? message
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
