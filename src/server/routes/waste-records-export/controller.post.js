import { proxyCsvStream } from '#server/common/helpers/proxy-csv-stream.js'
import { createLogger } from '#server/common/helpers/logging/logger.js'
import { fetchWasteRecordYears } from '#server/common/helpers/fetch-waste-record-years.js'

const logger = createLogger()

export const wasteRecordsExportPostController = {
  async handler(request, h) {
    const year = request.payload?.year

    try {
      if (!(await fetchWasteRecordYears(request)).includes(year)) {
        request.yar.set('error', 'Select a year to download')
        return h.redirect('/waste-records-export')
      }

      return await proxyCsvStream(
        request,
        h,
        `/v1/admin/waste-records/export.csv?year=${year}`,
        `waste-records-${year}.csv`
      )
    } catch (error) {
      logger.error({
        message: 'Failed to stream waste records export',
        err: error
      })

      const errorMessage =
        error.output?.payload?.message ||
        'There was a problem downloading the waste records export. Please try again.'

      request.yar.set('error', errorMessage)
      return h.redirect('/waste-records-export')
    }
  }
}
