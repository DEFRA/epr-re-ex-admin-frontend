import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import {
  fetchOrganisationOverview,
  findRegistration
} from '#server/common/helpers/fetch-organisation-overview.js'
import { formatPeriod } from '#server/common/helpers/format-reporting-period.js'
import { accreditationStatusActions } from '#server/routes/accreditation-status-transition/transitions.js'
import { registrationStatusActions } from '#server/routes/registration-status-transition/transitions.js'

const GREEN_TAG = 'govuk-tag--green'
const RED_TAG = 'govuk-tag--red'

const EXPORTER_PROCESSING_TYPE = 'exporter'

const SUBMITTED_STATUS = 'submitted'

const periodKey = (period) => `${period.year}-${period.period}`

/**
 * Builds the view model for each calendar reporting period, flagging a
 * submission as superseded when a later submitted submission exists for the same
 * period. A superseded submission must not offer the Unsubmit action:
 * unsubmitting it would silently drop it from the submission history (PAE-1657).
 * The backend enforces the same rule; ADR-0038 keeps the calendar payload free
 * of superseded fields, so the flag is derived here.
 * @param {Array<Record<string, any>>} reportingPeriods
 * @param {string} cadence
 */
const toReportingPeriods = (reportingPeriods, cadence) => {
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
      period.submissionNumber < latestSubmittedSubmission.get(periodKey(period))
  }))
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

/**
 * URLs for the accreditation-scoped overview links: null when the
 * registration has no accreditation, and overseas sites additionally only
 * apply to exporters.
 * @param {{ accreditation?: { id: string }, processingType?: string }} registration
 * @param {string} organisationId
 * @param {string} registrationId
 */
const buildAccreditationUrls = (
  registration,
  organisationId,
  registrationId
) => {
  const accreditationBaseUrl = registration.accreditation
    ? `/organisations/${organisationId}/registrations/${registrationId}/accreditations/${registration.accreditation.id}`
    : null

  return {
    wasteBalanceEventsUrl: accreditationBaseUrl
      ? `${accreditationBaseUrl}/waste-balance-events`
      : null,
    overseasSitesUrl:
      accreditationBaseUrl &&
      registration.processingType === EXPORTER_PROCESSING_TYPE
        ? `${accreditationBaseUrl}/overseas-sites`
        : null,
    prnActivityDownloadUrl: accreditationBaseUrl
      ? `${accreditationBaseUrl}/prn-activity/download`
      : null
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
            `/organisations/${organisationId}/registrations/${registrationId}/accreditations/${registration.accreditation.id}`,
            registration.status
          )
        : [],
      registrationStatusActions: registrationStatusActions(
        registration.status,
        `/organisations/${organisationId}/registrations/${registrationId}`
      ),
      cadence: calendar.cadence,
      reportingPeriods: toReportingPeriods(
        calendar.reportingPeriods,
        calendar.cadence
      ),
      summaryLogRows,
      wasteBalance,
      error: errorMessage,
      wasteRecordsDownloadUrl: `/organisations/${organisationId}/registrations/${registrationId}/waste-records/download`,
      ...buildAccreditationUrls(registration, organisationId, registrationId)
    })
  }
}
