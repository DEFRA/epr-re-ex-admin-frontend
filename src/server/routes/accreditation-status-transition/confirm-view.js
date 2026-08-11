const EMPTY_DATE = { day: '', month: '', year: '' }

// Accreditations run to 31 December of the accreditation year (Reg 97(7)), so
// the confirm page offers that as a starting point rather than an empty field.
// It is only a default: the regulator can overwrite it, and once the form has
// been submitted the POST controller passes the entered values back, so a
// re-render never silently reinstates this. Computed per render so it stays
// correct across a year boundary.
const defaultValidTo = () => ({
  day: '31',
  month: '12',
  year: String(new Date().getFullYear())
})

/** @import {AccreditationStatusTransition} from './transitions.js' */
/** @import {GrantFormValues} from './grant-form.js' */

/**
 * Builds the view context for a transition's confirm page. Used by the GET
 * controller and by the POST controller when re-rendering with field errors
 * or a backend rejection.
 * @param {string} action - URL action segment (e.g. 'suspend')
 * @param {AccreditationStatusTransition} transition
 * @param {{ organisationId: string, registrationId: string, accreditationId: string }} params
 * @param {{
 *   values?: GrantFormValues,
 *   errors?: {
 *     validFrom?: string,
 *     validTo?: string,
 *     accreditationNumber?: string
 *   } | null,
 *   backendError?: string
 * }} [state]
 */
export const buildConfirmView = (
  action,
  transition,
  { organisationId, registrationId, accreditationId },
  {
    values = {
      validFrom: EMPTY_DATE,
      validTo: defaultValidTo(),
      accreditationNumber: ''
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
