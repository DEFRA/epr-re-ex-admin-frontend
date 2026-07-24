import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { statusCodes } from '#server/common/constants/status-codes.js'
import { buildConfirmView } from './confirm-view.js'
import { parseGrantForm } from './grant-form.js'

/** @import {AccreditationStatusTransition} from './transitions.js' */

/**
 * Builds the POST controller for a status transition action. Posts the
 * transition's from/to statuses (plus grant fields where the transition
 * collects them) to the backend status-history endpoint and redirects to the
 * registration overview, flashing any backend error. Invalid grant fields
 * re-render the confirm page with an error summary instead.
 * @param {string} action - URL action segment (e.g. 'suspend')
 * @param {AccreditationStatusTransition} transition
 */
export const createTransitionPostController = (action, transition) => ({
  async handler(request, h) {
    const { organisationId, registrationId, accreditationId } = request.params
    const overviewUrl = `/organisations/${organisationId}/registrations/${registrationId}/overview`

    /** @type {{ fromStatus: string, toStatus: string, appliesFrom?: string, accreditationNumber?: string }} */
    const body = {
      fromStatus: transition.fromStatus,
      toStatus: transition.toStatus
    }

    if (transition.hasGrantFields) {
      const { values, errors, appliesFrom } = parseGrantForm(request.payload)

      if (errors) {
        return h
          .view(
            'routes/accreditation-status-transition/confirm',
            buildConfirmView(action, transition, request.params, {
              pageTitle: transition.pageTitle,
              values,
              errors
            })
          )
          .code(statusCodes.badRequest)
      }

      body.appliesFrom = /** @type {string} */ (appliesFrom)
      body.accreditationNumber = values.accreditationNumber
    }

    try {
      await fetchJsonFromBackend(
        request,
        `/v1/organisations/${organisationId}/registrations/${registrationId}/accreditations/${accreditationId}/status-history`,
        {
          method: 'POST',
          body: JSON.stringify(body)
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
