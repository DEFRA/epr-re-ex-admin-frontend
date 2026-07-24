import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { statusCodes } from '#server/common/constants/status-codes.js'

/** @import {AccreditationStatusTransition} from './transitions.js' */

/**
 * Builds the POST controller for a status transition action. Posts the
 * transition's target status to the backend status-history endpoint and
 * redirects to the registration overview, flashing any error.
 * @param {AccreditationStatusTransition} transition
 */
export const createTransitionPostController = (transition) => ({
  async handler(request, h) {
    const { organisationId, registrationId, accreditationId } = request.params
    const overviewUrl = `/organisations/${organisationId}/registrations/${registrationId}/overview`

    try {
      await fetchJsonFromBackend(
        request,
        `/v1/organisations/${organisationId}/registrations/${registrationId}/accreditations/${accreditationId}/status-history`,
        {
          method: 'POST',
          body: JSON.stringify({ status: transition.targetStatus })
        }
      )
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

      request.yar.set('error', errorMessage)
    }

    return h.redirect(overviewUrl)
  }
})
