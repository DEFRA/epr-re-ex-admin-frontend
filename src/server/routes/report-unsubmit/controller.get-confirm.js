import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import {
  fetchOrganisationOverview,
  findRegistration
} from '#server/common/helpers/fetch-organisation-overview.js'
import { PAGE_TITLE } from './constants.js'
import { formatPeriod } from '#server/common/helpers/format-reporting-period.js'

/**
 * Mirrors the backend's has-any-key rule (reports/domain/resubmission.js): the
 * flag is a container of the reasons a resubmission was asked for, so its
 * presence alone says nothing.
 * @param {Record<string, unknown> | null | undefined} resubmissionRequired
 */
const isResubmissionRequired = (resubmissionRequired) =>
  Object.keys(resubmissionRequired ?? {}).length > 0

/**
 * The reason the backend would refuse to unsubmit this report, or null when it
 * would accept it. Surfaced as a flash error on the overview rather than
 * letting the confirmation promise an outcome that cannot be delivered.
 * @param {{ resubmissionRequired?: Record<string, unknown>, status: { currentStatus: string } }} report
 * @returns {string | null}
 */
const refusalReason = (report) => {
  if (report.status.currentStatus !== 'submitted') {
    return 'This report cannot be unsubmitted because it is no longer submitted.'
  }
  if (isResubmissionRequired(report.resubmissionRequired)) {
    return 'This report cannot be unsubmitted because a resubmission has been requested for this period.'
  }
  return null
}

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

    const refusal = refusalReason(report)
    if (refusal) {
      request.yar.set('error', refusal)
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
      year,
      submissionNumber
    })
  }
}
