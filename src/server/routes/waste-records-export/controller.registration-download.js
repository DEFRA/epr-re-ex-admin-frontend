import { proxyCsvStream } from '#server/common/helpers/proxy-csv-stream.js'
import { createLogger } from '#server/common/helpers/logging/logger.js'

const logger = createLogger()

/**
 * Streams the waste records CSV for a single registration. Triggered from the
 * registration overview page so a regulator can download just one org's data.
 */
export const wasteRecordsRegistrationDownloadController = {
  async handler(request, h) {
    const { organisationId, registrationId } = request.params

    const query = new URLSearchParams({
      organisationId,
      registrationId
    })

    try {
      return await proxyCsvStream(
        request,
        h,
        `/v1/admin/waste-records/export.csv?${query}`,
        'waste-records.csv'
      )
    } catch (error) {
      logger.error({
        message: 'Failed to stream waste records export for registration',
        err: error
      })

      const errorMessage =
        error.output?.payload?.message ||
        'There was a problem downloading the waste records. Please try again.'

      request.yar.set('error', errorMessage)
      return h.redirect(
        `/organisations/${organisationId}/registrations/${registrationId}/overview`
      )
    }
  }
}
