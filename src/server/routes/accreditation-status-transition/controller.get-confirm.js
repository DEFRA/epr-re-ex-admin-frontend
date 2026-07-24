/** @import {AccreditationStatusTransition} from './transitions.js' */

/**
 * Builds the confirm-page GET controller for a status transition action.
 * @param {string} action - URL action segment (e.g. 'suspend')
 * @param {AccreditationStatusTransition} transition
 */
export const createConfirmGetController = (action, transition) => ({
  handler(request, h) {
    const { organisationId, registrationId, accreditationId } = request.params
    const overviewUrl = `/organisations/${organisationId}/registrations/${registrationId}/overview`

    return h.view('routes/accreditation-status-transition/confirm', {
      pageTitle: request.route.settings.app.pageTitle,
      heading: transition.heading,
      warningText: transition.warningText,
      buttonText: transition.buttonText,
      buttonClasses: transition.buttonClasses,
      overviewUrl,
      postUrl: `/organisations/${organisationId}/registrations/${registrationId}/accreditations/${accreditationId}/${action}`
    })
  }
})
