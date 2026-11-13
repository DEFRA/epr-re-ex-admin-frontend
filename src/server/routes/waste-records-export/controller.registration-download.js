import Joi from 'joi'

import { proxyCsvStream } from '#server/common/helpers/proxy-csv-stream.js'
import { createLogger } from '#server/common/helpers/logging/logger.js'
import { registrationPath } from '#server/common/helpers/backend-paths.js'
import {
  registrationOverviewUrl,
  registrationYearUrl
} from '#server/common/helpers/page-urls.js'

const logger = createLogger()

/**
 * Streams the waste records CSV for a single registration and year. Triggered
 * from a registration year page so a regulator can download just one org's
 * data for that year. Without a year the backend picks one, until it requires
 * it (PAE-2277).
 */
export const wasteRecordsRegistrationDownloadController = {
  options: {
    validate: {
      query: Joi.object({ year: Joi.string().pattern(/^\d{4}$/) })
    }
  },
  async handler(request, h) {
    const { year } = request.query
    const yearQuery = year ? `?year=${year}` : ''

    try {
      return await proxyCsvStream(
        request,
        h,
        `${registrationPath(request.params)}/waste-records/export.csv${yearQuery}`,
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
        year
          ? registrationYearUrl({ ...request.params, year })
          : registrationOverviewUrl(request.params)
      )
    }
  }
}
