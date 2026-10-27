import Boom from '@hapi/boom'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import {
  fetchOrganisationView,
  latestAccreditation,
  processingTypeOf,
  registrationIn,
  siteOf
} from '#server/common/helpers/fetch-organisation-view.js'
import { toReportingPeriods } from '#server/common/helpers/reporting-periods.js'
import {
  accreditationPath,
  organisationPath,
  registrationPath
} from '#server/common/helpers/backend-paths.js'
import { fetchReportingPeriods } from '#server/common/helpers/fetch-reporting-periods.js'
import { statusCodes } from '#server/common/constants/status-codes.js'
import { errorCodes } from '#server/common/enums/error-codes.js'
import { notFound } from '#server/common/helpers/logging/cdp-boom.js'
import {
  organisationOverviewUrl,
  overseasSitesUrl,
  prnActivityDownloadUrl,
  registrationOverviewUrl,
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

/**
 * @import { PeriodStatus } from '#server/common/constants/report-status.js'
 * @import { HapiRequest } from '#server/common/hapi-types.js'
 * @import { RegistrationView } from '#server/common/helpers/fetch-organisation-view.js'
 * @import { AccreditationKeys, RegistrationKeys } from '#server/common/helpers/natural-keys/swap-keys.js'
 */

const GREEN_TAG = 'govuk-tag--green'
const RED_TAG = 'govuk-tag--red'

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

/**
 * @param {HapiRequest} request
 * @param {AccreditationKeys} accreditationKeys
 */
const fetchWasteBalance = async (request, accreditationKeys) => {
  try {
    return await fetchJsonFromBackend(
      request,
      `${accreditationPath(accreditationKeys)}/waste-balance`,
      {}
    )
  } catch (err) {
    // A 404 is an accreditation the backend does not serve, not an outage
    if (!Boom.isBoom(err, statusCodes.notFound)) {
      request.logger.warn({ message: 'Failed to fetch waste balance', err })
    }
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
 * The years the organisation held an approved registration, newest first.
 * @param {HapiRequest} request
 * @param {string} organisationNumber
 * @returns {Promise<number[]>}
 */
const fetchYears = async (request, organisationNumber) => {
  const { years } = await fetchJsonFromBackend(
    request,
    `${organisationPath({ organisationNumber })}/years`,
    {}
  )
  return years
}

/**
 * The year whose reports the page shows: the one asked for, else the latest.
 * @param {number[]} years
 * @param {number | undefined} requestedYear
 * @param {RegistrationKeys} registrationKeys
 * @returns {number | undefined}
 */
const selectYear = (years, requestedYear, registrationKeys) => {
  if (requestedYear === undefined) {
    return years[0]
  }
  if (!years.includes(requestedYear)) {
    throw notFound('Report year not found', errorCodes.reportYearNotFound, {
      event: {
        action: 'fetch_report_year',
        reason: `organisationNumber=${registrationKeys.organisationNumber} registrationNumber=${registrationKeys.registrationNumber} year=${requestedYear}`
      }
    })
  }
  return requestedYear
}

/**
 * The registration's reporting periods for the year, or `null` when the
 * backend does not serve the registration, as with one missing data the read
 * model needs.
 * @param {HapiRequest} request
 * @param {RegistrationKeys} registrationKeys
 * @param {number} year
 */
const fetchPeriods = async (request, registrationKeys, year) => {
  try {
    return await fetchReportingPeriods(request, { ...registrationKeys, year })
  } catch (err) {
    if (Boom.isBoom(err, statusCodes.notFound)) {
      return null
    }
    throw err
  }
}

/**
 * The links the page derives from the registration; the accreditation-scoped
 * ones only when it has an accreditation.
 * @param {RegistrationView} registration
 * @param {RegistrationKeys} registrationKeys
 * @param {AccreditationKeys | null} accreditationKeys
 */
const toRegistrationLinks = (
  registration,
  registrationKeys,
  accreditationKeys
) => ({
  isExporter: registration.wasteProcessingType === 'exporter',
  wasteRecordsDownloadUrl: `${registrationPath(registrationKeys)}/waste-records/download`,
  ...(accreditationKeys && {
    wasteBalanceEventsUrl: wasteBalanceEventsUrl(accreditationKeys),
    overseasSitesUrl: overseasSitesUrl(accreditationKeys),
    prnActivityDownloadUrl: prnActivityDownloadUrl(accreditationKeys)
  })
})

export const registrationOverviewGETController = {
  async handler(request, h) {
    const { organisationNumber, registrationNumber } = request.params
    /** @type {RegistrationKeys} */
    const registrationKeys = { organisationNumber, registrationNumber }

    const errorMessage = request.yar.get('error')
    await request.yar.clear('error')

    const [organisation, years] = await Promise.all([
      fetchOrganisationView(request, organisationNumber),
      fetchYears(request, organisationNumber)
    ])
    const registration = registrationIn(organisation, registrationNumber)
    const reportsYear = selectYear(years, request.query.year, registrationKeys)
    const accreditation = latestAccreditation(registration)
    const accreditationKeys = accreditation && {
      ...registrationKeys,
      year: accreditation.year
    }

    const [summaryLogRows, reportingPeriods, wasteBalance] = await Promise.all([
      fetchSummaryLogRows(request, registrationKeys),
      reportsYear === undefined
        ? null
        : fetchPeriods(request, registrationKeys, reportsYear),
      accreditationKeys ? fetchWasteBalance(request, accreditationKeys) : null
    ])

    const pageTitle = request.route.settings.app.pageTitle

    return h.view('routes/registration-overview/index', {
      breadcrumbs: [
        { text: 'Organisations', href: '/organisations' },
        {
          text: 'Organisation overview',
          href: organisationOverviewUrl({ organisationNumber })
        }
      ],
      pageTitle,
      heading: `${organisation.name} - ${registrationNumber}`,
      registration: {
        status: registration.status.current,
        processingType: processingTypeOf(registration),
        material: registration.material,
        site: siteOf(registration),
        accreditation
      },
      ...toRegistrationLinks(registration, registrationKeys, accreditationKeys),
      reportRows: reportingPeriods
        ? toReportingPeriods(reportingPeriods).map(
            toReportRow(
              registrationKeys,
              request.auth.credentials.scopes.includes(SCOPES.adminWrite)
            )
          )
        : [],
      reportsYear,
      reportYearLinks: years
        .filter((year) => year !== reportsYear)
        .map((year) => ({
          text: String(year),
          href: `${registrationOverviewUrl(registrationKeys)}?year=${year}#reports`
        })),
      summaryLogRows,
      wasteBalance,
      error: errorMessage
    })
  }
}
