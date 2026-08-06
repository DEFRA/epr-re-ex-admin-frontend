import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import {
  fetchOrganisationOverview,
  findRegistration
} from '#server/common/helpers/fetch-organisation-overview.js'
import { PAGE_TITLE } from './constants.js'
import { formatPeriod } from '#server/common/helpers/format-reporting-period.js'
import { toReportingPeriods } from '#server/common/helpers/reporting-periods.js'
import {
  periodSubmissionPath,
  reportsCalendarPath
} from '#server/common/helpers/backend-paths.js'

/**
 * @import { PeriodSubmissionRequest } from '#server/common/hapi-types.js'
 */

/**
 * Mirrors the backend's has-any-key rule (reports/domain/resubmission.js): the
 * flag is a container of the reasons a resubmission was asked for, so its
 * presence alone says nothing.
 * @param {Record<string, unknown> | null | undefined} resubmissionRequired
 */
const isResubmissionRequired = (resubmissionRequired) =>
  Object.keys(resubmissionRequired ?? {}).length > 0

/**
 * The reason the backend would refuse to unsubmit this submission, or null when
 * it would accept it. Surfaced as a flash error on the overview rather than
 * letting the confirmation promise an outcome that cannot be delivered.
 * Mirrors the three refusals in reports/routes/unsubmit.js.
 * @param {{ resubmissionRequired?: Record<string, unknown>, status: { currentStatus: string } }} report
 * @param {{ isSuperseded?: boolean } | undefined} calendarPeriod
 * @returns {string | null}
 */
const refusalReason = (report, calendarPeriod) => {
  if (report.status.currentStatus !== 'submitted') {
    return 'This report cannot be unsubmitted because it is no longer submitted.'
  }
  if (isResubmissionRequired(report.resubmissionRequired)) {
    return 'This report cannot be unsubmitted because a resubmission has been requested for this period.'
  }
  if (calendarPeriod?.isSuperseded) {
    return 'This report cannot be unsubmitted because a later submission has superseded it.'
  }
  return null
}

/**
 * The stored report for this submission, carrying its status and resubmission
 * flag.
 * @param {PeriodSubmissionRequest} request
 */
const fetchPeriodSubmission = (request) =>
  fetchJsonFromBackend(request, periodSubmissionPath(request.params), {})

/**
 * The calendar item for this submission. Supersession is not carried on the
 * report itself: it comes from the sibling submissions the calendar surfaces,
 * via the same derivation the registration overview gates its Unsubmit link on.
 * @param {PeriodSubmissionRequest} request
 */
const fetchCalendarPeriod = async (request) => {
  const { year, period, submissionNumber } = request.params

  const calendar = await fetchJsonFromBackend(
    request,
    reportsCalendarPath(request.params),
    {}
  )

  return toReportingPeriods(calendar.reportingPeriods, calendar.cadence).find(
    (item) =>
      item.year === Number(year) &&
      item.period === Number(period) &&
      item.submissionNumber === Number(submissionNumber)
  )
}

export const reportUnsubmitConfirmGetController = {
  /** @param {PeriodSubmissionRequest} request */
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

    const [report, calendarPeriod] = await Promise.all([
      fetchPeriodSubmission(request),
      fetchCalendarPeriod(request)
    ])

    const refusal = refusalReason(report, calendarPeriod)
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
      pageTitle: request.route.settings.app?.pageTitle,
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
