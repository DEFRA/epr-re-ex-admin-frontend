const EMPTY_DATE = { day: '', month: '', year: '' }

// Registrations almost always run to the end of the current calendar year, so
// the confirm page offers 31 December as a starting point rather than an empty
// field. It is only a default: the regulator can overwrite it, and once the
// form has been submitted the POST controller passes the entered values back,
// so a re-render never silently reinstates this. Computed per render so it
// stays correct across a year boundary.
const defaultValidTo = () => ({
  day: '31',
  month: '12',
  year: String(new Date().getFullYear())
})

/** @import {RegistrationStatusTransition} from './transitions.js' */
/** @import {GrantFormValues} from './grant-form.js' */

/**
 * Builds the view context for a transition's confirm page. Used by the GET
 * controller and by the POST controller when re-rendering with field errors
 * or a backend rejection.
 * @param {string} action - URL action segment (e.g. 'approve')
 * @param {RegistrationStatusTransition} transition
 * @param {{ organisationId: string, registrationId: string }} params
 * @param {{
 *   values?: GrantFormValues,
 *   errors?: {
 *     validFrom?: string,
 *     validTo?: string,
 *     registrationNumber?: string
 *   } | null,
 *   backendError?: string
 * }} [state]
 */
export const buildConfirmView = (
  action,
  transition,
  { organisationId, registrationId },
  {
    values = {
      validFrom: EMPTY_DATE,
      validTo: defaultValidTo(),
      registrationNumber: ''
    },
    errors = null,
    backendError
  } = {}
) => {
  const errorList = []
  if (backendError) {
    errorList.push({ text: backendError })
  }
  if (errors?.validFrom) {
    errorList.push({ text: errors.validFrom, href: '#valid-from-day' })
  }
  if (errors?.validTo) {
    errorList.push({ text: errors.validTo, href: '#valid-to-day' })
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
