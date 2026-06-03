import { errorCodes } from '#server/common/enums/error-codes.js'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { fetchOrganisationOverview } from '#server/common/helpers/fetch-organisation-overview.js'
import { notFound } from '#server/common/helpers/logging/cdp-boom.js'

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

    const overview = await fetchOrganisationOverview(request, organisationId)

    const registration = findRegistrationByAccreditation(
      overview,
      accreditationId
    )

    if (!registration?.accreditation) {
      throw notFound(
        'Accreditation not found',
        errorCodes.accreditationNotFound,
        {
          event: {
            action: 'fetch_waste_balance_events',
            reason: `organisationId=${organisationId} accreditationId=${accreditationId}`
          }
        }
      )
    }

    const events = await fetchJsonFromBackend(
      request,
      `/v1/admin/registrations/${registration.id}/accreditations/${accreditationId}/waste-balance-events`,
      {}
    )

    const heading = `${overview.companyName} - ${registration.accreditation.accreditationNumber}`

    const eventRows = events.map((event) => [
      { text: event.number },
      { text: event.kind },
      { text: event.createdAt },
      { text: event.createdBy.name },
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
        {
          text: 'Registration overview',
          href: `/organisations/${organisationId}/registrations/${registration.id}/overview`
        }
      ],
      pageTitle: request.route.settings.app.pageTitle,
      heading,
      eventRows
    })
  }
}
