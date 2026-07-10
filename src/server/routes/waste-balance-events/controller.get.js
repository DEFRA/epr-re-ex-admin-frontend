import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import {
  fetchOrganisationOverview,
  findRegistration
} from '#server/common/helpers/fetch-organisation-overview.js'

/**
 * Format an actor for display: "Name (email)", "Name", "email", or "".
 * @param {{ id: string, name?: string, email?: string }} actor
 * @returns {string}
 */
const formatActor = (actor) => {
  const { name, email } = actor
  if (name && email) {
    return `${name} (${email})`
  }
  return name ?? email ?? ''
}

export const wasteBalanceEventsGETController = {
  async handler(request, h) {
    const { organisationId, registrationId, accreditationId } = request.params

    const overview = await fetchOrganisationOverview(request, organisationId)
    const registration = findRegistration(
      overview,
      organisationId,
      registrationId
    )

    const events = await fetchJsonFromBackend(
      request,
      `/v1/admin/organisations/${organisationId}/registrations/${registrationId}/accreditations/${accreditationId}/waste-balance-events`,
      {}
    )

    const heading = `${overview.companyName} - ${registration.accreditation?.accreditationNumber}`

    const eventRows = events.map((event) => [
      { text: event.number },
      { text: event.kind },
      { text: event.createdAt },
      { text: formatActor(event.createdBy) },
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
          href: `/organisations/${organisationId}/registrations/${registrationId}/overview`
        }
      ],
      pageTitle: request.route.settings.app.pageTitle,
      heading,
      eventRows
    })
  }
}
