import { writeToString } from '@fast-csv/format'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { sanitizeFormulaInjection } from '#server/common/helpers/sanitize-formula-injection.js'
import { formatDateTime } from '#server/common/helpers/formatters.js'
import { createLogger } from '#server/common/helpers/logging/logger.js'

const logger = createLogger()

/**
 * @param {import('./types.js').ReportSubmissionsRow[]} reportSubmissions
 * @param {string} generatedAt
 * @returns {Promise<string>}
 */
function generateCsv(reportSubmissions, generatedAt) {
  const rows = [
    ['Report submissions'],
    [],
    ['Generated at', formatDateTime(generatedAt)],
    [],
    [
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
    rows.push([
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
      row.tonnageReceivedForRecycling,
      row.tonnageRecycled,
      row.tonnageExportedForRecycling,
      row.tonnageSentOnTotal,
      row.tonnageSentOnToReprocessor,
      row.tonnageSentOnToExporter,
      row.tonnageSentOnToOtherFacilities,
      row.tonnagePrnsPernsIssued,
      row.totalRevenuePrnsPerns,
      row.averagePrnPernPricePerTonne,
      row.tonnageReceivedButNotRecycled,
      row.tonnageReceivedButNotExported,
      row.tonnageExportedThatWasStopped,
      row.tonnageExportedThatWasRefused,
      row.tonnageRepatriated,
      sanitizeFormulaInjection(row.noteToRegulator)
    ])
  }

  return writeToString(rows, { headers: false, quoteColumns: true })
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
      logger.error(error, 'Failed to generate report submissions CSV')

      const errorMessage =
        error.output?.payload?.message ||
        'There was a problem downloading the report submissions data. Please try again.'

      request.yar.set('error', errorMessage)

      return h.redirect('/report-submissions')
    }
  }
}
