import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import {
  fetchOrganisationOverview,
  findRegistration
} from '#server/common/helpers/fetch-organisation-overview.js'
import { PAGE_TITLE } from './constants.js'
import { formatPeriod } from '#server/common/helpers/format-reporting-period.js'

export const reportUnsubmitConfirmGetController = {
  async handler(request, h) {
    const {
      organisationId,
      registrationId,
      year,
      cadence,
      period,
      submissionNumber
    } = request.params

    const overviewUrl = `/organisations/${organisationId}/registrations/${registrationId}/overview`

    const report = await fetchJsonFromBackend(
      request,
      `/v1/organisations/${organisationId}/registrations/${registrationId}/reports/${year}/${cadence}/${period}/submissions/${submissionNumber}`,
      {}
    )

    if (report.status.currentStatus !== 'submitted') {
      return h.redirect(overviewUrl)
    }

    const overview = await fetchOrganisationOverview(request, organisationId)
    const registration = findRegistration(
      overview,
      organisationId,
      registrationId
    )

    return h.view('routes/report-unsubmit/confirm', {
      pageTitle: request.route.settings.app.pageTitle,
      heading: PAGE_TITLE,
      breadcrumbs: [
        { text: 'Organisations', href: '/organisations' },
        {
          text: 'Organisation overview',
          href: `/organisations/${organisationId}/overview`
        },
        {
          text: 'Registration overview',
          href: overviewUrl
        }
      ],
      overviewUrl,
      postUrl: `/organisations/${organisationId}/registrations/${registrationId}/reports/${year}/${cadence}/${period}/submissions/${submissionNumber}/unsubmit`,
      registrationNumber: registration.registrationNumber,
      formattedPeriod: formatPeriod(period, cadence),
      year
    })
  }
}
