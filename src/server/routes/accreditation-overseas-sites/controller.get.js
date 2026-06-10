import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import {
  fetchOrganisationOverview,
  findRegistration
} from '#server/common/helpers/fetch-organisation-overview.js'

/**
 * @typedef {{
 *   line1?: string,
 *   line2?: string,
 *   townOrCity?: string,
 *   stateOrRegion?: string,
 *   postcode?: string
 * }} OverseasSiteAddress
 *
 * @typedef {{
 *   orsId: string,
 *   name: string,
 *   country: string,
 *   address: OverseasSiteAddress
 * }} ResolvedOverseasSite
 *
 * @typedef {{
 *   orsId: string,
 *   name: null,
 *   country: null,
 *   address: null
 * }} UnresolvedOverseasSite
 *
 * @typedef {ResolvedOverseasSite | UnresolvedOverseasSite} OverseasSite
 */

/**
 * @param {OverseasSiteAddress | null} address
 * @returns {string}
 */
const formatAddress = (address) =>
  address
    ? [
        address.line1,
        address.line2,
        address.townOrCity,
        address.stateOrRegion,
        address.postcode
      ]
        .filter(Boolean)
        .join(', ')
    : ''

export const accreditationOverseasSitesGETController = {
  async handler(request, h) {
    const { organisationId, registrationId, accreditationId } = request.params

    const overview = await fetchOrganisationOverview(request, organisationId)
    const registration = findRegistration(
      overview,
      organisationId,
      registrationId
    )

    /** @type {OverseasSite[]} */
    const sites = await fetchJsonFromBackend(
      request,
      `/v1/organisations/${organisationId}/registrations/${registrationId}/accreditations/${accreditationId}/overseas-sites`,
      {}
    )

    const heading = `${overview.companyName} - ${registration.accreditation?.accreditationNumber}`

    const siteRows = sites.map((site) => [
      { text: site.orsId },
      { text: site.name ?? '' },
      { text: site.country ?? '' },
      { text: formatAddress(site.address) }
    ])

    return h.view('routes/accreditation-overseas-sites/index', {
      breadcrumbs: [
        { text: 'Organisations', href: '/organisations' },
        {
          text: 'Organisation overview',
          href: `/organisations/${organisationId}/overview`
        },
        {
          text: 'Registration overview',
          href: `/organisations/${organisationId}/registrations/${registrationId}/overview`
        }
      ],
      pageTitle: request.route.settings.app.pageTitle,
      heading,
      siteRows
    })
  }
}
