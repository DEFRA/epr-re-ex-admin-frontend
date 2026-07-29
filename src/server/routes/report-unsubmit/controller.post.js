import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import {
  fetchOrganisationOverview,
  findRegistration
} from '#server/common/helpers/fetch-organisation-overview.js'
import { formatPeriod } from '#server/common/helpers/format-reporting-period.js'
import { statusCodes } from '#server/common/constants/status-codes.js'
import { periodSubmissionUnsubmitPath } from '#server/common/helpers/backend-paths.js'

const REFUSED_REASON =
  'The report could not be unsubmitted because its status has changed. It may have been superseded by a later submission, or flagged for resubmission.'

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

    let reason = null

    try {
      await fetchJsonFromBackend(
        request,
        periodSubmissionUnsubmitPath(request.params),
        {
          method: 'POST'
        }
      )
      return h.redirect(resultUrl)
    } catch (error) {
      request.logger.error({ err: error, message: 'Unsubmit report failed' })
      // The backend answers every refusal with a 409, whether the report is
      // superseded, no longer submitted, or flagged for resubmission. It does
      // not say which, so neither do we (PAE-1775).
      if (error.output?.statusCode === statusCodes.conflict) {
        reason = REFUSED_REASON
      }
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
      reason,
      overviewUrl,
      registrationNumber: registration.registrationNumber,
      formattedPeriod: formatPeriod(period, cadence),
      year,
      submissionNumber
    })
  }
}
