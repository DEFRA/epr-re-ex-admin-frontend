import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

/**
 * @typedef {{ id: string, accreditationNumber: string, status: string }} Accreditation
 * @typedef {{ id: string, registrationNumber: string, status: string, material: string, site: string, processingType: string, accreditation?: Accreditation }} Registration
 * @typedef {{ id: string, companyName: string, registrations: Registration[] }} OrganisationOverview
 */

/**
 * @param {import('@hapi/hapi').Request} request
 * @param {string} organisationId
 * @returns {Promise<OrganisationOverview>}
 */
export const fetchOrganisationOverview = (request, organisationId) =>
  fetchJsonFromBackend(request, `/v1/organisations/${organisationId}/overview`, {})
