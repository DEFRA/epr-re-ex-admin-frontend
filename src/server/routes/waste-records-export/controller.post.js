import { streamFromBackend } from '#server/common/helpers/stream-from-backend.js'
import { createLogger } from '#server/common/helpers/logging/logger.js'

const logger = createLogger()

export const wasteRecordsExportPostController = {
  async handler(request, h) {
    try {
      const response = await streamFromBackend(
        request,
        '/v1/admin/waste-records/export.csv'
      )

      return h
        .response(response.body)
        .type(response.headers.get('content-type') ?? 'text/csv; charset=utf-8')
        .header(
          'Content-Disposition',
          response.headers.get('content-disposition') ??
            'attachment; filename="waste-records.csv"'
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
