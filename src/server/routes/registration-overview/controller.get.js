import Boom from '@hapi/boom'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import {
  fetchOrganisationOverview,
  findRegistration
} from '#server/common/helpers/fetch-organisation-overview.js'
import { toReportingPeriods } from '#server/common/helpers/reporting-periods.js'
import { registrationPath } from '#server/common/helpers/backend-paths.js'
import { fetchReportingPeriods } from '#server/common/helpers/fetch-reporting-periods.js'
import { statusCodes } from '#server/common/constants/status-codes.js'
import {
  overseasSitesUrl,
  prnActivityDownloadUrl,
  reportSubmissionUrl,
  reportUnsubmitUrl,
  summaryLogUrl,
  wasteBalanceEventsUrl
} from '#server/common/helpers/page-urls.js'
import {
  periodStatus,
  reportStatus
} from '#server/common/constants/report-status.js'
import { SCOPES } from '#server/common/helpers/auth/scopes.js'
import { accreditationStatusActions } from '#server/routes/accreditation-status-transition/transitions.js'
import { registrationStatusActions } from '#server/routes/registration-status-transition/transitions.js'
import { toNaturalKeys } from '#server/common/helpers/natural-keys/swap-keys.js'

/**
 * @import { PeriodStatus } from '#server/common/constants/report-status.js'
 * @import { OrganisationOverview } from '#server/common/helpers/fetch-organisation-overview.js'
 * @import { HapiRequest } from '#server/common/hapi-types.js'
 * @import { RegistrationKeys } from '#server/common/helpers/natural-keys/swap-keys.js'
 */

const GREEN_TAG = 'govuk-tag--green'
const RED_TAG = 'govuk-tag--red'

const EXPORTER_PROCESSING_TYPE = 'exporter'

/**
 * Labels for every periodStatus value, matching the wording the operator sees
 * in epr-frontend. Typed exhaustively so a status added to the enum cannot ship
 * without a label; a status the backend adds before this mirror knows about it
 * still renders as its raw token rather than blank.
 * @type {Record<PeriodStatus, string>}
 */
const PERIOD_STATUS_LABELS = {
  [periodStatus.due]: 'Due',
  [periodStatus.inProgress]: 'In progress',
  [periodStatus.overdue]: 'Overdue',
  [periodStatus.readyToSubmit]: 'Ready to submit',
  [periodStatus.requiresResubmission]: 'Requires resubmission',
  [periodStatus.submitted]: 'Submitted'
}

/**
 * Builds the view model for a reports table row, leaving the markup to the
 * template. The Unsubmit action is offered only where the backend would accept
 * it - a submitted report that is neither superseded nor flagged for
 * resubmission. Hiding it is UX; the backend enforces both rules and the
 * admin.write scope.
 * @param {{ organisationNumber: string, registrationNumber: string }} keys
 * @param {boolean} hasAdminWrite
 */
const toReportRow = (keys, hasAdminWrite) => (period) => {
  const submission = {
    ...keys,
    year: String(period.year),
    cadence: period.cadence,
    period: String(period.period),
    submissionNumber: String(period.submissionNumber)
  }

  const canUnsubmit =
    hasAdminWrite &&
    period.report?.status === reportStatus.submitted &&
    !period.isSuperseded &&
    !period.isFlaggedForResubmission

  // A resubmission draft keeps the period in its requires-resubmission state
  // rather than reporting the draft's own status, matching what the operator
  // sees in epr-frontend. Otherwise the framing vanishes the moment the draft
  // is started, leaving no sign why the submitted row lost its Unsubmit link.
  const status =
    period.periodStatus === periodStatus.requiresResubmission
      ? period.periodStatus
      : (period.report?.status ?? period.periodStatus)

  return {
    formattedPeriod: period.formattedPeriod,
    submissionNumber: period.report ? period.submissionNumber : '',
    dueDate: period.dueDate,
    statusText: PERIOD_STATUS_LABELS[status] ?? status,
    viewUrl: period.report ? reportSubmissionUrl(submission) : null,
    unsubmitUrl: canUnsubmit ? `${reportUnsubmitUrl(submission)}/confirm` : null
  }
}

const STATUS_DISPLAY = {
  submitted: { label: 'Success', className: GREEN_TAG },
  rejected: { label: 'Failed (Rejected)', className: RED_TAG },
  invalid: { label: 'Failed (Invalid)', className: RED_TAG },
  validation_failed: { label: 'Failed (Validation)', className: RED_TAG },
  submission_failed: { label: 'Failed (Submission)', className: RED_TAG }
}

/**
 * Builds the view model for a summary log row. STATUS_DISPLAY keeps the
 * status-to-label-and-colour decision; the template renders it through the
 * govukTag macro so the tag markup has a single source.
 * @param {RegistrationKeys} registrationKeys
 */
const toSummaryLogRow = (registrationKeys) => (summaryLog) => {
  const { summaryLogId, uploadedAt, status } = summaryLog
  const { label, className } = STATUS_DISPLAY[status]
  const viewUrl = summaryLogUrl({ ...registrationKeys, summaryLogId })

  return {
    uploadedAt,
    label,
    className,
    viewUrl,
    downloadUrl: `${viewUrl}/file`
  }
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
 * @param {HapiRequest} request
 * @param {RegistrationKeys} registrationKeys
 */
const fetchSummaryLogRows = async (request, registrationKeys) => {
  const { summaryLogs } = await fetchJsonFromBackend(
    request,
    `${registrationPath(registrationKeys)}/summary-logs`,
    {}
  )
  return summaryLogs.map(toSummaryLogRow(registrationKeys))
}

/**
 * The registration's reporting periods, or `null` when the backend does not
 * serve the registration, as with one missing data the read model needs.
 * @param {HapiRequest} request
 * @param {RegistrationKeys} registrationKeys
 */
const fetchPeriods = async (request, registrationKeys) => {
  try {
    return await fetchReportingPeriods(request, {
      ...registrationKeys,
      // Current year until PAE-2153 lists every year.
      year: new Date().getUTCFullYear()
    })
  } catch (err) {
    if (Boom.isBoom(err, statusCodes.notFound)) {
      return null
    }
    throw err
  }
}

/**
 * The links and status actions the page derives from the registration. The
 * accreditation-scoped ones are null when there is no accreditation, and
 * overseas sites additionally only apply to exporters. A link to a record that
 * has no number yet, as it is not approved, is null too: the template shows it
 * as not applicable.
 * @param {OrganisationOverview} overview
 * @param {string} organisationId
 * @param {string} registrationId
 * @param {Record<string, any>} registration
 */
const toRegistrationLinks = (
  overview,
  organisationId,
  registrationId,
  registration
) => {
  const registrationUrl = `/organisations/${organisationId}/registrations/${registrationId}`
  const accreditationUrl = registration.accreditation
    ? `${registrationUrl}/accreditations/${registration.accreditation.id}`
    : null
  const registrationKeys = toNaturalKeys(overview, {
    organisationId,
    registrationId
  })
  const approvedAccreditation = registration.accreditation
    ? toNaturalKeys(overview, {
        organisationId,
        registrationId,
        accreditationId: registration.accreditation.id
      })
    : null

  return {
    // The template only attaches these to their status rows for users holding
    // admin.write (hiding is UX - the backend enforces scope).
    accreditationStatusActions: accreditationUrl
      ? accreditationStatusActions(
          registration.accreditation.status,
          accreditationUrl,
          registration.status
        )
      : [],
    registrationStatusActions: registrationStatusActions(
      registration.status,
      registrationUrl
    ),
    isExporter: registration.processingType === EXPORTER_PROCESSING_TYPE,
    wasteBalanceEventsUrl:
      approvedAccreditation && wasteBalanceEventsUrl(approvedAccreditation),
    overseasSitesUrl:
      approvedAccreditation && overseasSitesUrl(approvedAccreditation),
    wasteRecordsDownloadUrl: registrationKeys
      ? `${registrationUrl}/waste-records/download`
      : null,
    prnActivityDownloadUrl:
      approvedAccreditation && prnActivityDownloadUrl(approvedAccreditation)
  }
}

export const registrationOverviewGETController = {
  async handler(request, h) {
    const { organisationId, registrationId } = request.params

    const errorMessage = request.yar.get('error')
    await request.yar.clear('error')

    const overview = await fetchOrganisationOverview(request, organisationId)

    const registration = findRegistration(
      overview,
      organisationId,
      registrationId
    )

    const registrationKeys = toNaturalKeys(overview, {
      organisationId,
      registrationId
    })

    const [summaryLogRows, reportingPeriods, wasteBalance] = await Promise.all([
      // A registration with no number yet has no summary logs or reports.
      registrationKeys ? fetchSummaryLogRows(request, registrationKeys) : [],
      registrationKeys ? fetchPeriods(request, registrationKeys) : null,
      registration.accreditation
        ? fetchWasteBalance(
            request,
            organisationId,
            registration.accreditation.id
          )
        : null
    ])

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
      ...toRegistrationLinks(
        overview,
        organisationId,
        registrationId,
        registration
      ),
      reportRows: reportingPeriods
        ? toReportingPeriods(reportingPeriods).map(
            toReportRow(
              {
                organisationNumber: overview.organisationNumber,
                registrationNumber: registration.registrationNumber
              },
              request.auth.credentials.scopes.includes(SCOPES.adminWrite)
            )
          )
        : [],
      summaryLogRows,
      wasteBalance,
      error: errorMessage
    })
  }
}
