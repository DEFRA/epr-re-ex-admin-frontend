import { writeToString } from '@fast-csv/format'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { formatDateTime } from '#server/common/helpers/formatters.js'
import { sanitizeFormulaInjection } from '#server/common/helpers/sanitize-formula-injection.js'
import { createLogger } from '#server/common/helpers/logging/logger.js'

const logger = createLogger()

function generateCsv(data, generatedAt) {
  const rows = [
    ['Summary log uploads report'],
    [],
    [
      'Report showing summary log upload activity for all registered operators with uploads.'
    ],
    [],
    [`Data generated at: ${formatDateTime(generatedAt)}`],
    [],
    [
      'Appropriate Agency',
      'Type',
      'Business Name',
      'Org ID',
      'Registration Number',
      'Accreditation Number',
      'Registered Reprocessing Site (UK)',
      'Packaging Waste Category',
      'Last Successful Upload',
      'Last Failed Upload',
      'Successful Uploads',
      'Failed Uploads'
    ]
  ]

  for (const row of data) {
    rows.push([
      row.appropriateAgency,
      row.type,
      sanitizeFormulaInjection(row.businessName),
      row.orgId,
      row.registrationNumber || '-',
      row.accreditationNumber || '-',
      sanitizeFormulaInjection(row.reprocessingSite) || '-',
      row.packagingWasteCategory,
      formatDateTime(row.lastSuccessfulUpload),
      formatDateTime(row.lastFailedUpload),
      row.successfulUploads,
      row.failedUploads
    ])
  }

  return writeToString(rows, { headers: false, quoteColumns: true })
}

export const summaryLogUploadsReportPostController = {
  async handler(request, h) {
    try {
      const data = await fetchJsonFromBackend(
        request,
        '/v1/organisations/registrations/summary-logs/reports/uploads'
      )
      const csv = await generateCsv(data.summaryLogUploads, data.generatedAt)
      const filename = 'summary-log.csv'

      return h
        .response(csv)
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', `attachment; filename="${filename}"`)
    } catch (error) {
      logger.error({
        err: error,
        message: 'Failed to download summary log uploads report'
      })

      request.yar.set(
        'error',
        'There was a problem downloading the summary log uploads report. Please try again.'
      )

      return h.redirect('/summary-log')
    }
  }
}
