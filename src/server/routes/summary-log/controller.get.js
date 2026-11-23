import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { formatDateTime } from '#server/common/helpers/formatters.js'
import { createLogger } from '#server/common/helpers/logging/logger.js'
import {
  defaultReportYear,
  reportUrlForYear,
  reportYears,
  yearItems
} from '#server/common/helpers/report-year.js'

const logger = createLogger()

export const summaryLogUploadsReportPath = '/summary-log'

export const summaryLogUploadsReportGetController = {
  async handler(request, h) {
    const { years, year } = await reportYears(request)
    if (year === undefined) {
      return h.redirect(
        reportUrlForYear(summaryLogUploadsReportPath, defaultReportYear(years))
      )
    }

    const errorMessage = request.yar.get('error')
    await request.yar.clear('error')

    const yearView = { year, yearItems: yearItems({ years, year }) }

    try {
      const data = await fetchJsonFromBackend(
        request,
        `/v1/organisations/registrations/summary-logs/reports/uploads?year=${year}`
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
        ...yearView,
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
        ...yearView,
        reportRows: [],
        totalRows: 0,
        error:
          'There was a problem loading the summary log uploads report. Please try again.'
      })
    }
  }
}
