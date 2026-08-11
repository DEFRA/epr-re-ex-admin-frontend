import { errorCodes } from '#server/common/enums/error-codes.js'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { notFound } from '#server/common/helpers/logging/cdp-boom.js'

/** @import { HapiRequest } from '#server/common/hapi-types.js' */

/**
 * An accreditation as the overview returns it, whether linked to a
 * registration or standing on its own. `accreditationNumber` is null until the
 * accreditation is approved, and `site` is absent for an exporter.
 * @typedef {{
 *   id: string,
 *   accreditationNumber: string | null,
 *   status: string,
 *   material?: string,
 *   processingType?: string,
 *   site?: string
 * }} Accreditation
 *
 * @typedef {{
 *   id: string,
 *   registrationNumber: string,
 *   status: string,
 *   material: string,
 *   site: string,
 *   processingType: string,
 *   reprocessingType?: string | null,
 *   accreditation?: Accreditation
 * }} Registration
 *
 * @typedef {{
 *   orgId: string,
 *   orgName: string,
 *   linkedAt: string,
 *   linkedBy: { email: string }
 * }} LinkedDefraOrganisation
 *
 * @typedef {{
 *   id: string,
 *   companyName: string,
 *   registrations: Registration[],
 *   unlinkedAccreditations?: Accreditation[],
 *   linkedDefraOrganisation?: LinkedDefraOrganisation
 * }} OrganisationOverview
 */

/**
 * @param {HapiRequest} request
 * @param {string} organisationId
 * @returns {Promise<OrganisationOverview>}
 */
export const fetchOrganisationOverview = (request, organisationId) =>
  fetchJsonFromBackend(
    request,
    `/v1/organisations/${organisationId}/overview`,
    {}
  )

/**
 * Find a registration on the overview by id, throwing an enriched 404
 * if it's missing.
 * @param {OrganisationOverview} overview
 * @param {string} organisationId
 * @param {string} registrationId
 * @returns {Registration}
 */
export const findRegistration = (overview, organisationId, registrationId) => {
  const registration = overview.registrations.find(
    (r) => r.id === registrationId
  )

  if (!registration) {
    throw notFound('Registration not found', errorCodes.registrationNotFound, {
      event: {
        action: 'fetch_registration',
        reason: `organisationId=${organisationId} registrationId=${registrationId}`
      }
    })
  }

  return registration
}

/**
 * Find an accreditation that is not linked to any registration, throwing an
 * enriched 404 if it's missing. An accreditation that has since been assigned
 * has left this collection, so the 404 also covers "someone else assigned it
 * while this page was open".
 * @param {OrganisationOverview} overview
 * @param {string} organisationId
 * @param {string} accreditationId
 * @returns {Accreditation}
 */
export const findUnlinkedAccreditation = (
  overview,
  organisationId,
  accreditationId
) => {
  const accreditation = overview.unlinkedAccreditations?.find(
    (a) => a.id === accreditationId
  )

  if (!accreditation) {
    throw notFound(
      'Unlinked accreditation not found',
      errorCodes.accreditationNotFound,
      {
        event: {
          action: 'fetch_unlinked_accreditation',
          reason: `organisationId=${organisationId} accreditationId=${accreditationId}`
        }
      }
    )
  }

  return accreditation
}
