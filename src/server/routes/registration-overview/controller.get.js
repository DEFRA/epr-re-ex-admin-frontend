import Boom from '@hapi/boom'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { fetchOrganisationOverview } from '#server/common/helpers/fetch-organisation-overview.js'

export const registrationOverviewGETController = {
  async handler(request, h) {
    const { organisationId, registrationId } = request.params

    const [overview, calendar] = await Promise.all([
      fetchOrganisationOverview(request, organisationId),
      fetchJsonFromBackend(
        request,
        `/v1/organisations/${organisationId}/registrations/${registrationId}/reports/calendar`,
        {}
      )
    ])

    const registration = overview.registrations.find(
      (r) => r.id === registrationId
    )

    if (!registration) {
      throw Boom.notFound()
    }

    const pageTitle = request.route.settings.app.pageTitle

    const heading = `${overview.companyName} - ${registration.registrationNumber ?? registration.id}`

    return h.view('routes/registration-overview/index', {
      breadcrumbs: [
        { text: 'Organisations', href: '/organisations' },
        {
          text: 'Organisation overview',
          href: `/organisations/${organisationId}/overview`
        }
      ],
      pageTitle,
      heading,
      organisationId,
      registrationId,
      registration,
      cadence: calendar.cadence,
      reportingPeriods: calendar.reportingPeriods
    })
  }
}
