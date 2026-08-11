import { candidateRegistrations } from './candidate-registrations.js'

/** @import { Accreditation, Registration } from '#server/common/helpers/fetch-organisation-overview.js' */

const NO_CANDIDATES_TEXT =
  'There are no registrations this accreditation can be assigned to. A registration must be approved, have the same material, processing type and site, have a reprocessing type, and not already have an accreditation.'

/**
 * Builds the view context for the assign page. Used by the GET controller and
 * by the POST controller when re-rendering after a missing selection or a
 * backend rejection, so the candidate list is derived the same way each time.
 * @param {{ organisationId: string, accreditationId: string }} params
 * @param {Accreditation} accreditation
 * @param {Registration[]} registrations
 * @param {{
 *   registrationId?: string,
 *   error?: string | null,
 *   backendError?: string
 * }} [state]
 */
export const buildAssignView = (
  { organisationId, accreditationId },
  accreditation,
  registrations,
  { registrationId = '', error = null, backendError } = {}
) => {
  const candidates = candidateRegistrations(registrations, accreditation)

  const errorList = []
  if (backendError) {
    errorList.push({ text: backendError })
  }
  if (error) {
    errorList.push({ text: error, href: '#registrationId' })
  }

  const overviewUrl = `/organisations/${organisationId}/overview`

  return {
    pageTitle: 'Assign accreditation to registration',
    heading: 'Assign accreditation to registration',
    breadcrumbs: [
      { text: 'Organisations', href: '/organisations' },
      { text: 'Organisation overview', href: overviewUrl }
    ],
    hintText: `Only approved ${accreditation.material} registrations matching this accreditation and without an accreditation of their own are listed.`,
    noCandidatesText: NO_CANDIDATES_TEXT,
    hasCandidates: candidates.length > 0,
    // A blank leading option keeps the browser from pre-selecting the first
    // registration, so "mandatory" means the admin actually chose one.
    items: [
      { value: '', text: '', selected: !registrationId },
      ...candidates.map((registration) => ({
        value: registration.id,
        text: `${registration.registrationNumber} - ${registration.material} - ${registration.reprocessingType}`,
        selected: registration.id === registrationId
      }))
    ],
    error,
    errorList,
    overviewUrl,
    postUrl: `/organisations/${organisationId}/accreditations/${accreditationId}/assign`
  }
}
