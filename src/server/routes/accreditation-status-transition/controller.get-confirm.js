import { buildConfirmView } from './confirm-view.js'

/** @import {AccreditationStatusTransition} from './transitions.js' */

/**
 * Builds the confirm-page GET controller for a status transition action.
 * @param {string} action - URL action segment (e.g. 'suspend')
 * @param {AccreditationStatusTransition} transition
 */
export const createConfirmGetController = (action, transition) => ({
  handler(request, h) {
    return h.view(
      'routes/accreditation-status-transition/confirm',
      buildConfirmView(action, transition, request.params)
    )
  }
})
