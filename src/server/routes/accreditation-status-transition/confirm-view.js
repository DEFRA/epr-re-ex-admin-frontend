/** @import {AccreditationStatusTransition} from './transitions.js' */

/**
 * Builds the view context for a transition's confirm page. Used by the GET
 * controller and by the POST controller when re-rendering with field errors
 * or a backend rejection.
 * @param {string} action - URL action segment (e.g. 'suspend')
 * @param {AccreditationStatusTransition} transition
 * @param {{ organisationId: string, registrationId: string, accreditationId: string }} params
 * @param {{
 *   values?: { day: string, month: string, year: string, accreditationNumber: string },
 *   errors?: { appliesFrom?: string, accreditationNumber?: string } | null,
 *   backendError?: string
 * }} [state]
 */
export const buildConfirmView = (
  action,
  transition,
  { organisationId, registrationId, accreditationId },
  {
    values = { day: '', month: '', year: '', accreditationNumber: '' },
    errors = null,
    backendError
  } = {}
) => {
  const errorList = []
  if (backendError) {
    errorList.push({ text: backendError })
  }
  if (errors?.appliesFrom) {
    errorList.push({ text: errors.appliesFrom, href: '#applies-from-day' })
  }
  if (errors?.accreditationNumber) {
    errorList.push({
      text: errors.accreditationNumber,
      href: '#accreditation-number'
    })
  }

  return {
    pageTitle: transition.pageTitle,
    heading: transition.heading,
    warningText: transition.warningText,
    buttonText: transition.buttonText,
    buttonClasses: transition.buttonClasses,
    hasGrantFields: Boolean(transition.hasGrantFields),
    values,
    errors,
    errorList,
    overviewUrl: `/organisations/${organisationId}/registrations/${registrationId}/overview`,
    postUrl: `/organisations/${organisationId}/registrations/${registrationId}/accreditations/${accreditationId}/${action}`
  }
}
