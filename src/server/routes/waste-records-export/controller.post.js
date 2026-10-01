import { proxyCsvStream } from '#server/common/helpers/proxy-csv-stream.js'
import { createLogger } from '#server/common/helpers/logging/logger.js'

const logger = createLogger()

export const wasteRecordsExportPostController = {
  async handler(request, h) {
    try {
      return await proxyCsvStream(
        request,
        h,
        '/v1/admin/waste-records/export.csv',
        'waste-records.csv'
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
