/** @import {RegistrationStatusTransition} from './transitions.js' */

/**
 * Builds the view context for a transition's confirm page. Used by the GET
 * controller and by the POST controller when re-rendering with field errors
 * or a backend rejection.
 * @param {string} action - URL action segment (e.g. 'approve')
 * @param {RegistrationStatusTransition} transition
 * @param {{ organisationId: string, registrationId: string }} params
 * @param {{
 *   values?: { day: string, month: string, year: string, registrationNumber: string },
 *   errors?: { appliesFrom?: string, registrationNumber?: string } | null,
 *   backendError?: string
 * }} [state]
 */
export const buildConfirmView = (
  action,
  transition,
  { organisationId, registrationId },
  {
    values = { day: '', month: '', year: '', registrationNumber: '' },
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
  if (errors?.registrationNumber) {
    errorList.push({
      text: errors.registrationNumber,
      href: '#registration-number'
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
    postUrl: `/organisations/${organisationId}/registrations/${registrationId}/${action}`
  }
}
