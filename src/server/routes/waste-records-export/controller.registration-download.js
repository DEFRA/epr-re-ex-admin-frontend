import Joi from 'joi'

import { proxyCsvStream } from '#server/common/helpers/proxy-csv-stream.js'
import { createLogger } from '#server/common/helpers/logging/logger.js'
import { registrationPath } from '#server/common/helpers/backend-paths.js'
import { registrationYearUrl } from '#server/common/helpers/page-urls.js'
import { yearSchema } from '#server/common/helpers/natural-keys/accreditation-params.js'

const logger = createLogger()

/**
 * Streams the waste records CSV for a single registration and year. Triggered
 * from a registration year page so a regulator can download just one org's
 * data for that year.
 */
export const wasteRecordsRegistrationDownloadController = {
  options: {
    validate: {
      query: Joi.object({ year: yearSchema.required() })
    }
  },
  async handler(request, h) {
    const { year } = request.query

    try {
      return await proxyCsvStream(
        request,
        h,
        `${registrationPath(request.params)}/waste-records/export.csv?year=${year}`,
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
      return h.redirect(registrationYearUrl({ ...request.params, year }))
    }
  }
}
