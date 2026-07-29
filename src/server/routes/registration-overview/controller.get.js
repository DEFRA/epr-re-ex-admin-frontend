import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import {
  fetchOrganisationOverview,
  findRegistration
} from '#server/common/helpers/fetch-organisation-overview.js'
import { formatPeriod } from '#server/common/helpers/format-reporting-period.js'
import { SCOPES } from '#server/common/helpers/auth/scopes.js'
import { accreditationStatusActions } from '#server/routes/accreditation-status-transition/transitions.js'

const GREEN_TAG = 'govuk-tag--green'
const RED_TAG = 'govuk-tag--red'

const EXPORTER_PROCESSING_TYPE = 'exporter'

const SUBMITTED_STATUS = 'submitted'

const REQUIRES_RESUBMISSION_STATUS = 'requires_resubmission'

const periodKey = (period) => `${period.year}-${period.period}`

/**
 * Builds the view model for each calendar reporting period, deriving the two
 * conditions the backend refuses an unsubmit under so the action is not offered
 * where it can only fail: the submission is superseded by a later submitted one
 * (PAE-1657), or the period is flagged for resubmission (PAE-1775). ADR-0038
 * keeps the calendar payload free of both, so they are derived here - the
 * flagged report and its requires_resubmission item are separate calendar items,
 * hence the per-period set.
 * @param {Array<Record<string, any>>} reportingPeriods
 * @param {string} cadence
 */
const toReportingPeriods = (reportingPeriods, cadence) => {
  const periodsRequiringResubmission = new Set(
    reportingPeriods
      .filter((period) => period.periodStatus === REQUIRES_RESUBMISSION_STATUS)
      .map(periodKey)
  )
  const latestSubmittedSubmission = new Map()
  for (const period of reportingPeriods) {
    if (period.report?.status !== SUBMITTED_STATUS) {
      continue
    }
    const key = periodKey(period)
    latestSubmittedSubmission.set(
      key,
      Math.max(latestSubmittedSubmission.get(key) ?? 0, period.submissionNumber)
    )
  }
  return reportingPeriods.map((period) => ({
    ...period,
    formattedPeriod: formatPeriod(period.period, cadence),
    isSuperseded:
      period.report?.status === SUBMITTED_STATUS &&
      period.submissionNumber <
        latestSubmittedSubmission.get(periodKey(period)),
    isFlaggedForResubmission: periodsRequiringResubmission.has(
      periodKey(period)
    )
  }))
}

/**
 * Labels for the backend's PERIOD_STATUS values, matching the wording the
 * operator sees in epr-frontend. An unmapped status renders as its raw token
 * rather than blank, so a value added backend-first stays legible.
 */
const PERIOD_STATUS_LABELS = {
  due: 'Due',
  in_progress: 'In progress',
  overdue: 'Overdue',
  ready_to_submit: 'Ready to submit',
  requires_resubmission: 'Requires resubmission',
  submitted: 'Submitted'
}

/**
 * Builds the view model for a reports table row, leaving the markup to the
 * template. The Unsubmit action is offered only where the backend would accept
 * it - a submitted report that is neither superseded nor flagged for
 * resubmission. Hiding it is UX; the backend enforces both rules and the
 * admin.write scope.
 * @param {string} organisationId
 * @param {string} registrationId
 * @param {string} cadence
 * @param {boolean} hasAdminWrite
 */
const toReportRow =
  (organisationId, registrationId, cadence, hasAdminWrite) => (period) => {
    const submissionUrl = `/organisations/${organisationId}/registrations/${registrationId}/reports/${period.year}/${cadence}/${period.period}/submissions/${period.submissionNumber}`

    const canUnsubmit =
      hasAdminWrite &&
      period.report?.status === SUBMITTED_STATUS &&
      !period.isSuperseded &&
      !period.isFlaggedForResubmission

    const status = period.report?.status ?? period.periodStatus

    return {
      formattedPeriod: period.formattedPeriod,
      submissionNumber: period.report ? period.submissionNumber : '',
      dueDate: period.dueDate,
      statusText: PERIOD_STATUS_LABELS[status] ?? status,
      viewUrl: period.report ? submissionUrl : null,
      unsubmitUrl: canUnsubmit ? `${submissionUrl}/unsubmit/confirm` : null
    }
  }

const STATUS_DISPLAY = {
  submitted: { label: 'Success', className: GREEN_TAG },
  rejected: { label: 'Failed (Rejected)', className: RED_TAG },
  invalid: { label: 'Failed (Invalid)', className: RED_TAG },
  validation_failed: { label: 'Failed (Validation)', className: RED_TAG },
  submission_failed: { label: 'Failed (Submission)', className: RED_TAG }
}

const toSummaryLogTableRow =
  (organisationId, registrationId) => (summaryLog) => {
    const { summaryLogId, uploadedAt, status } = summaryLog

    const { label, className } = STATUS_DISPLAY[status]

    const downloadUrl = `/system-logs/download/${organisationId}/${registrationId}/${summaryLogId}`

    return [
      { text: uploadedAt },
      { html: `<strong class="govuk-tag ${className}">${label}</strong>` },
      {
        html: `<a class="govuk-link govuk-link--no-visited-state" href="${downloadUrl}">Download</a>`
      }
    ]
  }

const fetchWasteBalance = async (request, organisationId, accreditationId) => {
  try {
    const balanceMap = await fetchJsonFromBackend(
      request,
      `/v1/organisations/${organisationId}/waste-balances?accreditationIds=${accreditationId}`,
      {}
    )
    return balanceMap[accreditationId] ?? null
  } catch (err) {
    request.logger.warn({ message: 'Failed to fetch waste balance', err })
    return null
  }
}

export const registrationOverviewGETController = {
  async handler(request, h) {
    const { organisationId, registrationId } = request.params

    const errorMessage = request.yar.get('error')
    await request.yar.clear('error')

    const [overview, calendar, { summaryLogs }] = await Promise.all([
      fetchOrganisationOverview(request, organisationId),
      fetchJsonFromBackend(
        request,
        `/v1/organisations/${organisationId}/registrations/${registrationId}/reports/calendar?expand=submissions`,
        {}
      ),
      fetchJsonFromBackend(
        request,
        `/v1/organisations/${organisationId}/registrations/${registrationId}/summary-logs`,
        {}
      )
    ])

    const registration = findRegistration(
      overview,
      organisationId,
      registrationId
    )

    const wasteBalance = registration.accreditation
      ? await fetchWasteBalance(
          request,
          organisationId,
          registration.accreditation.id
        )
      : null

    const pageTitle = request.route.settings.app.pageTitle

    const heading = `${overview.companyName} - ${registration.registrationNumber ?? registration.id}`

    const summaryLogRows = summaryLogs.map(
      toSummaryLogTableRow(organisationId, registrationId)
    )

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
      // The template only attaches these to the Accreditation status row for
      // users holding admin.write (hiding is UX — the backend enforces scope).
      accreditationStatusActions: registration.accreditation
        ? accreditationStatusActions(
            registration.accreditation.status,
            `/organisations/${organisationId}/registrations/${registrationId}/accreditations/${registration.accreditation.id}`
          )
        : [],
      reportRows: toReportingPeriods(
        calendar.reportingPeriods,
        calendar.cadence
      ).map(
        toReportRow(
          organisationId,
          registrationId,
          calendar.cadence,
          request.auth.credentials.scopes.includes(SCOPES.adminWrite)
        )
      ),
      summaryLogRows,
      wasteBalance,
      error: errorMessage,
      wasteBalanceEventsUrl: registration.accreditation
        ? `/organisations/${organisationId}/registrations/${registrationId}/accreditations/${registration.accreditation.id}/waste-balance-events`
        : null,
      overseasSitesUrl:
        registration.accreditation &&
        registration.processingType === EXPORTER_PROCESSING_TYPE
          ? `/organisations/${organisationId}/registrations/${registrationId}/accreditations/${registration.accreditation.id}/overseas-sites`
          : null,
      wasteRecordsDownloadUrl: `/organisations/${organisationId}/registrations/${registrationId}/waste-records/download`,
      prnActivityDownloadUrl: registration.accreditation
        ? `/organisations/${organisationId}/registrations/${registrationId}/accreditations/${registration.accreditation.id}/prn-activity/download`
        : null
    })
  }
}
