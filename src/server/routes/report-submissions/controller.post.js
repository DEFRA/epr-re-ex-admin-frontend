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
      'Registration submitter contact number',
      'Registration approved person contact number',
      'Registration submitter email address',
      'Registration approved person email address',
      'Material',
      'Registration No',
      'Accreditation No',
      'Report Type',
      'Reporting Period',
      'Due Date',
      'Submitted Date',
      'Submitted By'
    ]
  ]

  for (const row of reportSubmissions) {
    rows.push([
      sanitizeFormulaInjection(row.organisationName),
      row.submitterPhone,
      row.approvedPersonsPhone,
      row.submitterEmail,
      row.approvedPersonsEmail,
      row.material,
      row.registrationNumber,
      row.accreditationNumber,
      row.reportType,
      row.reportingPeriod,
      row.dueDate,
      row.submittedDate,
      sanitizeFormulaInjection(row.submittedBy)
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
