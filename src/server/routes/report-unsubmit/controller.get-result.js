import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import {
  fetchOrganisationOverview,
  findRegistration
} from '#server/common/helpers/fetch-organisation-overview.js'
import { formatPeriod } from '#server/common/helpers/format-reporting-period.js'

export const reportUnsubmitResultGetController = {
  async handler(request, h) {
    const { organisationId, registrationId, year, cadence, period } =
      request.params

    const overviewUrl = `/organisations/${organisationId}/registrations/${registrationId}/overview`

    const report = await fetchJsonFromBackend(
      request,
      `/v1/organisations/${organisationId}/registrations/${registrationId}/reports/${year}/${cadence}/${period}`,
      {}
    )

    const success =
      report.status.currentStatus === 'ready_to_submit' &&
      Boolean(report.status.unsubmitted?.at)

    if (!success) {
      return h.redirect(overviewUrl)
    }

    const overview = await fetchOrganisationOverview(request, organisationId)
    const registration = findRegistration(
      overview,
      organisationId,
      registrationId
    )

    return h.view('routes/report-unsubmit/result', {
      pageTitle: request.route.settings.app.pageTitle,
      success: true,
      breadcrumbs: [
        { text: 'Organisations', href: '/organisations' },
        {
          text: 'Organisation overview',
          href: `/organisations/${organisationId}/overview`
        },
        { text: 'Registration overview', href: overviewUrl }
      ],
      overviewUrl,
      registrationNumber: registration.registrationNumber,
      formattedPeriod: formatPeriod(period, cadence),
      year
    })
  }
}
