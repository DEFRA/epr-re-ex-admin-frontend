import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import {
  fetchOrganisationOverview,
  findRegistration
} from '#server/common/helpers/fetch-organisation-overview.js'
import {
  toDisplayValue,
  toValidFromDisplayValue
} from '#server/common/helpers/overseas-site-display.js'

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
 *   name: string,
 *   country: string,
 *   address: OverseasSiteAddress,
 *   coordinates: string | null,
 *   validFrom: string | null
 * }} ResolvedOverseasSite
 *
 * @typedef {{
 *   name: null,
 *   country: null,
 *   address: null,
 *   coordinates: null,
 *   validFrom: null
 * }} UnresolvedOverseasSite
 *
 * @typedef {ResolvedOverseasSite | UnresolvedOverseasSite} OverseasSite
 *
 * Sites keyed by their three-digit ORS id, the natural key scoped to the
 * accreditation.
 * @typedef {Record<string, OverseasSite>} OverseasSites
 */

export const accreditationOverseasSitesGETController = {
  async handler(request, h) {
    const { organisationId, registrationId, accreditationId } = request.params

    const overview = await fetchOrganisationOverview(request, organisationId)
    const registration = findRegistration(
      overview,
      organisationId,
      registrationId
    )

    /** @type {OverseasSites} */
    const sites = await fetchJsonFromBackend(
      request,
      `/v1/organisations/${organisationId}/registrations/${registrationId}/accreditations/${accreditationId}/overseas-sites`,
      {}
    )

    const heading = `${overview.companyName} - ${registration.accreditation?.accreditationNumber}`

    const packagingWasteCategory = toDisplayValue(registration.material)

    const siteRows = Object.keys(sites)
      .sort((a, b) => a.localeCompare(b))
      .map((orsId) => {
        const site = sites[orsId]
        return [
          { text: toDisplayValue(orsId) },
          { text: packagingWasteCategory },
          { text: toDisplayValue(site.country) },
          { text: toDisplayValue(site.name) },
          { text: toDisplayValue(site.address?.line1) },
          { text: toDisplayValue(site.address?.line2) },
          { text: toDisplayValue(site.address?.townOrCity) },
          { text: toDisplayValue(site.address?.stateOrRegion) },
          { text: toDisplayValue(site.address?.postcode) },
          { text: toDisplayValue(site.coordinates) },
          { text: toValidFromDisplayValue(site.validFrom) }
        ]
      })

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
