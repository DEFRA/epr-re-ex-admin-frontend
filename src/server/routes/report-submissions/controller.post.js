import { writeToString } from '@fast-csv/format'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { sanitizeFormulaInjection } from '#server/common/helpers/sanitize-formula-injection.js'
import { toCsvNumber } from '#server/common/helpers/to-csv-number.js'
import { formatDateTime } from '#server/common/helpers/formatters.js'
import { createLogger } from '#server/common/helpers/logging/logger.js'

const logger = createLogger()

/**
 * @param {import('./types.js').ReportSubmissionsRow} row
 * @returns {(string | number)[]}
 */
function buildDataRow(row) {
  return [
    row.regulator,
    sanitizeFormulaInjection(row.organisationName),
    row.approvedPersonsPhone,
    row.approvedPersonsEmail,
    row.submitterPhone,
    row.submitterEmail,
    row.material,
    row.accreditationNumber,
    row.registrationNumber,
    row.reportType,
    row.reportingPeriod,
    row.dueDate,
    row.submittedDate,
    sanitizeFormulaInjection(row.submittedBy),
    toCsvNumber(row.tonnageReceivedForRecycling),
    toCsvNumber(row.tonnageRecycled),
    toCsvNumber(row.tonnageExportedForRecycling),
    toCsvNumber(row.tonnageSentOnTotal),
    toCsvNumber(row.tonnageSentOnToReprocessor),
    toCsvNumber(row.tonnageSentOnToExporter),
    toCsvNumber(row.tonnageSentOnToOtherFacilities),
    toCsvNumber(row.tonnagePrnsPernsIssued),
    toCsvNumber(row.freeTonnagePrnsPerns),
    toCsvNumber(row.totalRevenuePrnsPerns),
    toCsvNumber(row.averagePrnPernPricePerTonne),
    toCsvNumber(row.tonnageReceivedButNotRecycled),
    toCsvNumber(row.tonnageReceivedButNotExported),
    toCsvNumber(row.tonnageExportedThatWasStopped),
    toCsvNumber(row.tonnageExportedThatWasRefused),
    toCsvNumber(row.tonnageRepatriated),
    sanitizeFormulaInjection(row.noteToRegulator)
  ]
}

/**
 * @param {import('./types.js').ReportSubmissionsRow[]} reportSubmissions
 * @param {string} generatedAt
 * @returns {Promise<string>}
 */
function generateCsv(reportSubmissions, generatedAt) {
  /** @type {(string | number)[][]} */
  const rows = [
    ['Report submissions'],
    [],
    ['Generated at', formatDateTime(generatedAt)],
    [],
    [
      'Regulator',
      'Organisation name',
      'Organisation registered approver contact number',
      'Organisation registered approver person email address',
      'Organisation registered submitter contact number',
      'Organisation registered submitter email address',
      'Material',
      'Accreditation No',
      'Registered No',
      'Report Type',
      'Report Period',
      'Due Date',
      'Submitted Date',
      'Submitted By',
      'Tonnage received for recycling',
      'Tonnage recycled',
      'Tonnage exported for recycling',
      'Tonnage sent on, total',
      'Tonnage sent on to a reprocessor',
      'Tonnage sent on to an exporter',
      'Tonnage sent on to other facilities',
      'Tonnage of PRNs/PERNs issued',
      'Self-issued (free) tonnage',
      'Total revenue from PRNs/PERNs',
      'Average PRN/PERN price per tonne',
      'Tonnage received but not recycled',
      'Tonnage received but not exported',
      'Tonnage exported that was stopped',
      'Tonnage exported that was refused',
      'Tonnage repatriated',
      'Note to regulator'
    ]
  ]

  for (const row of reportSubmissions) {
    rows.push(buildDataRow(row))
  }

  return writeToString(rows, { headers: false })
}

export const reportSubmissionsPostController = {
  async handler(request, h) {
    try {
      const data = await fetchJsonFromBackend(
        request,
        '/v1/organisations/reports/submissions'
      )

      const csv = await generateCsv(data.reportSubmissions, data.generatedAt)

      return h
        .response(csv)
        .header('Content-Type', 'text/csv')
        .header(
          'Content-Disposition',
          'attachment; filename="report-submissions.csv"'
        )
    } catch (error) {
      logger.error({
        message: 'Failed to generate report submissions CSV',
        err: error
      })

      const errorMessage =
        error.output?.payload?.message ||
        'There was a problem downloading the report submissions data. Please try again.'

      request.yar.set('error', errorMessage)

      return h.redirect('/report-submissions')
    }
  }
}
