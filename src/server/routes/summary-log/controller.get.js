import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { formatDateTime } from '#server/common/helpers/formatters.js'
import { createLogger } from '#server/common/helpers/logging/logger.js'

const logger = createLogger()

export const summaryLogUploadsReportGetController = {
  async handler(request, h) {
    const errorMessage = request.yar.get('error')
    await request.yar.clear('error')

    try {
      const data = await fetchJsonFromBackend(
        request,
        '/v1/organisations/registrations/summary-logs/reports/uploads'
      )

      const reportRows = data.summaryLogUploads.map((row) => ({
        appropriateAgency: row.appropriateAgency,
        type: row.type,
        businessName: row.businessName,
        orgId: row.orgId,
        registrationNumber: row.registrationNumber || '-',
        accreditationNumber: row.accreditationNumber || '-',
        reprocessingSite: row.reprocessingSite || '-',
        packagingWasteCategory: row.packagingWasteCategory,
        lastSuccessfulUpload: formatDateTime(row.lastSuccessfulUpload),
        lastFailedUpload: formatDateTime(row.lastFailedUpload),
        successfulUploads: row.successfulUploads,
        failedUploads: row.failedUploads
      }))

      return h.view('routes/summary-log/uploads-report', {
        pageTitle: request.route.settings.app.pageTitle,
        reportRows,
        totalRows: reportRows.length,
        generatedAt: formatDateTime(data.generatedAt),
        error: errorMessage
      })
    } catch (error) {
      logger.error({
        err: error,
        message: 'Failed to load summary log uploads report'
      })

      return h.view('routes/summary-log/uploads-report', {
        pageTitle: request.route.settings.app.pageTitle,
        reportRows: [],
        totalRows: 0,
        error:
          'There was a problem loading the summary log uploads report. Please try again.'
      })
    }
  }
}
