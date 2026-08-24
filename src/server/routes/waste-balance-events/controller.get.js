import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import {
  fetchOrganisationOverview,
  findRegistration
} from '#server/common/helpers/fetch-organisation-overview.js'

/**
 * One entry of a waste balance ledger, as the backend answers it.
 *
 * An event concerns a summary log or a note, never both, and states that one
 * subject under a key that names it.
 * @typedef {{
 *   number: number,
 *   kind: string,
 *   createdAt: string,
 *   createdBy: { id: string, name?: string, email?: string },
 *   balance: {
 *     opening: { total: number, available: number },
 *     closing: { total: number, available: number }
 *   },
 *   summaryLog?: { id: string, creditTotal: number },
 *   prn?: { id: string, tonnage: number }
 * }} LedgerEvent
 */

/**
 * The thing the event concerns, under the key that names it. The page shows it
 * raw, so the key has to travel with the value: an `id` alone says which
 * record without saying which kind of record.
 * @param {LedgerEvent} event
 * @returns {string}
 */
const subjectOf = (event) =>
  JSON.stringify(
    event.summaryLog ? { summaryLog: event.summaryLog } : { prn: event.prn }
  )

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

    const { events } = /** @type {{ events: LedgerEvent[] }} */ (
      await fetchJsonFromBackend(
        request,
        `/v1/organisations/${organisationId}/registrations/${registrationId}/accreditations/${accreditationId}/waste-balance-ledger`,
        {}
      )
    )

    const heading = `${overview.companyName} - ${registration.accreditation?.accreditationNumber}`

    const eventRows = events.map((event) => ({
      number: event.number,
      kind: event.kind,
      createdAt: event.createdAt,
      createdBy: formatActor(event.createdBy),
      subject: subjectOf(event),
      closingAmount: event.balance.closing.total,
      closingAvailableAmount: event.balance.closing.available
    }))

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
