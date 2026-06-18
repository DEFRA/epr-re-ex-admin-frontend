import { errorCodes } from '#server/common/enums/error-codes.js'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { notFound } from '#server/common/helpers/logging/cdp-boom.js'

/**
 * @import { HapiRequest } from '#server/common/hapi-types.js'
 */

/**
 * @typedef {{
 *   id: string,
 *   accreditationNumber: string,
 *   status: string
 * }} Accreditation
 *
 * @typedef {{
 *   id: string,
 *   registrationNumber: string,
 *   status: string,
 *   material: string,
 *   site: string,
 *   processingType: string,
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
