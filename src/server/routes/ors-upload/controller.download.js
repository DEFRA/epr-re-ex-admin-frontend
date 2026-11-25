import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { buildBackendPath } from './helpers.js'
import { orsUploadRoutes } from './constants.js'
import {
  backendRows,
  csvAttachment,
  overseasSiteCsvHeaders,
  overseasSiteCsvValues,
  toCsv
} from './overseas-sites-csv.js'
import {
  defaultReportYear,
  reportUrlForYear,
  reportYears
} from '#server/common/helpers/report-year.js'

function generateCsv(data) {
  return toCsv([
    overseasSiteCsvHeaders,
    ...backendRows(data).map(overseasSiteCsvValues)
  ])
}

export const orsDownloadController = {
  async handler(request, h) {
    let listUrl = orsUploadRoutes.list

    try {
      const { years, year } = await reportYears(request)
      if (year === undefined) {
        return h.redirect(
          reportUrlForYear(orsUploadRoutes.list, defaultReportYear(years))
        )
      }
      listUrl = reportUrlForYear(orsUploadRoutes.list, year)

      const data = await fetchJsonFromBackend(
        request,
        buildBackendPath({ year, all: true })
      )
      const csv = await generateCsv(data)

      return csvAttachment(h, csv, `overseas-reprocessing-sites-${year}.csv`)
    } catch (error) {
      const errorMessage =
        error.output?.payload?.message ||
        'There was a problem downloading the overseas reprocessing site data. Please try again.'

      request.yar.set('error', errorMessage)

      return h.redirect(listUrl)
    }
  }
}
