import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import {
  fetchOrganisationOverview,
  findRegistration
} from '#server/common/helpers/fetch-organisation-overview.js'
import { formatPeriod } from '#server/common/helpers/format-reporting-period.js'

export const reportUnsubmitPostController = {
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
    const resultUrl = `/organisations/${organisationId}/registrations/${registrationId}/reports/${year}/${cadence}/${period}/submissions/${submissionNumber}/unsubmit/result`

    try {
      await fetchJsonFromBackend(
        request,
        `/v1/organisations/${organisationId}/registrations/${registrationId}/reports/${year}/${cadence}/${period}/submissions/${submissionNumber}/unsubmit`,
        { method: 'POST' }
      )
      return h.redirect(resultUrl)
    } catch (error) {
      request.logger.error({ err: error, message: 'Unsubmit report failed' })
    }

    const overview = await fetchOrganisationOverview(request, organisationId)
    const registration = findRegistration(
      overview,
      organisationId,
      registrationId
    )

    return h.view('routes/report-unsubmit/result', {
      pageTitle: 'Unsubmit report',
      breadcrumbs: [
        { text: 'Organisations', href: '/organisations' },
        {
          text: 'Organisation overview',
          href: `/organisations/${organisationId}/overview`
        },
        { text: 'Registration overview', href: overviewUrl }
      ],
      success: false,
      overviewUrl,
      registrationNumber: registration.registrationNumber,
      formattedPeriod: formatPeriod(period, cadence),
      year,
      submissionNumber
    })
  }
}
