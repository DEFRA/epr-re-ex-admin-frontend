import { format } from '@fast-csv/format'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { formatDateTime } from '#server/common/helpers/formatters.js'
import { createLogger } from '#server/common/helpers/logging/logger.js'

const logger = createLogger()

function generateCsv(data) {
  return new Promise((resolve, reject) => {
    const csvStream = format({ headers: false, quoteColumns: true })
    const rows = []

    csvStream.on('data', (row) => rows.push(row))
    csvStream.on('error', reject)
    csvStream.on('end', () => resolve(rows.join('')))

    // Write header rows
    csvStream.write(['Summary log uploads report'])
    csvStream.write([])
    csvStream.write([
      'Report showing summary log upload activity for all registered operators with uploads.'
    ])
    csvStream.write([])
    csvStream.write([
      `Data generated at: ${formatDateTime(new Date().toISOString())}`
    ])
    csvStream.write([])
    csvStream.write([
      'Appropriate Agency',
      'Type',
      'Business name',
      'Org ID',
      'Registration number',
      'Accreditation No',
      'Registered Reprocessing site (UK)',
      'Packaging Waste Category',
      'Last Successful Upload',
      'Last Failed Upload',
      'Successful Uploads',
      'Failed Uploads'
    ])

    // Write data rows
    for (const row of data) {
      csvStream.write([
        row.appropriateAgency,
        row.type,
        row.businessName,
        row.orgId,
        row.registrationNumber,
        row.accreditationNo || '-',
        row.reprocessingSite || '-',
        row.packagingWasteCategory,
        formatDateTime(row.lastSuccessfulUpload),
        formatDateTime(row.lastFailedUpload),
        row.successfulUploads,
        row.failedUploads
      ])
    }

    csvStream.end()
  })
}

export const summaryLogUploadsReportPostController = {
  async handler(request, h) {
    try {
      const data = await fetchJsonFromBackend(
        request,
        '/v1/organisations/registrations/summary-logs/reports/uploads'
      )
      const csv = await generateCsv(data)
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
