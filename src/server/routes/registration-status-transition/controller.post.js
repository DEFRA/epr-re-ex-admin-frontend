import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { statusCodes } from '#server/common/constants/status-codes.js'
import { buildConfirmView } from './confirm-view.js'
import { parseGrantForm } from './grant-form.js'

/** @import {RegistrationStatusTransition} from './transitions.js' */

const CONFIRM_VIEW = 'routes/registration-status-transition/confirm'

/**
 * Builds the POST controller for a status transition action. Posts the
 * transition's from/to statuses (plus grant fields where the transition
 * collects them) to the backend status-history endpoint and redirects to the
 * registration overview, flashing any backend error. Invalid grant fields —
 * and backend rejections of them — re-render the confirm page with an error
 * summary instead.
 * @param {string} action - URL action segment (e.g. 'approve')
 * @param {RegistrationStatusTransition} transition
 */
export const createTransitionPostController = (action, transition) => ({
  async handler(request, h) {
    const { organisationId, registrationId } = request.params
    const overviewUrl = `/organisations/${organisationId}/registrations/${registrationId}/overview`

    /** @type {{ fromStatus: string, toStatus: string, appliesFrom?: string, registrationNumber?: string }} */
    const body = {
      fromStatus: transition.fromStatus,
      toStatus: transition.toStatus
    }

    /** @type {{ day: string, month: string, year: string, registrationNumber: string } | undefined} */
    let grantValues

    if (transition.hasGrantFields) {
      const { values, errors, appliesFrom } = parseGrantForm(request.payload)
      grantValues = values

      if (errors) {
        return h
          .view(
            CONFIRM_VIEW,
            buildConfirmView(action, transition, request.params, {
              values,
              errors
            })
          )
          .code(statusCodes.badRequest)
      }

      body.appliesFrom = /** @type {string} */ (appliesFrom)
      body.registrationNumber = values.registrationNumber
    }

    try {
      await fetchJsonFromBackend(
        request,
        `/v1/organisations/${organisationId}/registrations/${registrationId}/status-history`,
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

      // A backend rejection of the grant fields re-renders the confirm page
      // so the admin keeps what they typed; 5xx and network failures still
      // flash on the overview, where retrying immediately won't help.
      if (grantValues && statusCode < statusCodes.internalServerError) {
        return h
          .view(
            CONFIRM_VIEW,
            buildConfirmView(action, transition, request.params, {
              values: grantValues,
              backendError: errorMessage
            })
          )
          .code(statusCodes.badRequest)
      }

      request.yar.set('error', errorMessage)
    }

    return h.redirect(overviewUrl)
  }
})
