import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { fetchOrganisationOverview } from '#server/common/helpers/fetch-organisation-overview.js'

/**
 * Find the registration linked to the given accreditation.
 * @param {import('#server/common/helpers/fetch-organisation-overview.js').OrganisationOverview} overview
 * @param {string} accreditationId
 */
const findRegistrationByAccreditation = (overview, accreditationId) =>
  overview.registrations.find((r) => r.accreditation?.id === accreditationId)

export const wasteBalanceEventsGETController = {
  async handler(request, h) {
    const { organisationId, accreditationId } = request.params

    const [overview, events] = await Promise.all([
      fetchOrganisationOverview(request, organisationId),
      fetchJsonFromBackend(
        request,
        `/v1/admin/organisations/${organisationId}/accreditations/${accreditationId}/stream-events`,
        {}
      )
    ])

    const registration = findRegistrationByAccreditation(
      overview,
      accreditationId
    )

    const accreditationLabel =
      registration?.accreditation?.accreditationNumber ?? accreditationId

    const heading = `${overview.companyName} - ${accreditationLabel}`

    const eventRows = events.map((event) => [
      { text: event.number },
      { text: event.kind },
      { text: event.createdAt },
      { html: `<code>${JSON.stringify(event.payload)}</code>` },
      { text: event.closingBalance.amount },
      { text: event.closingBalance.availableAmount }
    ])

    return h.view('routes/waste-balance-events/index', {
      breadcrumbs: [
        { text: 'Organisations', href: '/organisations' },
        {
          text: 'Organisation overview',
          href: `/organisations/${organisationId}/overview`
        },
        ...(registration
          ? [
              {
                text: 'Registration overview',
                href: `/organisations/${organisationId}/registrations/${registration.id}/overview`
              }
            ]
          : [])
      ],
      pageTitle: request.route.settings.app.pageTitle,
      heading,
      eventRows
    })
  }
}
