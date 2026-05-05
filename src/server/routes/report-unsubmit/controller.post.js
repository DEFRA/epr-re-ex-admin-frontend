import Boom from '@hapi/boom'
import { config } from '#config/config.js'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { statusCodes } from '#server/common/constants/status-codes.js'
import { FEATURE_FLAG_KEY, SESSION_KEY } from './constants.js'

export const reportUnsubmitPostController = {
  async handler(request, h) {
    if (!config.get(FEATURE_FLAG_KEY)) {
      throw Boom.notFound()
    }

    const { organisationId, registrationId, year, cadence, period } =
      request.params

    const resultUrl = `/organisations/${organisationId}/registrations/${registrationId}/reports/${year}/${cadence}/${period}/unsubmit/result`

    try {
      await fetchJsonFromBackend(
        request,
        `/v1/organisations/${organisationId}/registrations/${registrationId}/reports/${year}/${cadence}/${period}/unsubmit`,
        { method: 'POST' }
      )
      request.yar.set(SESSION_KEY, { success: true })
    } catch (error) {
      request.logger.error({ err: error, message: 'Unsubmit report failed' })
      const statusCode = error?.output?.statusCode
      let message
      if (statusCode === statusCodes.conflict) {
        message =
          'The report is not in a submitted state and cannot be unsubmitted.'
      } else if (statusCode === statusCodes.notFound) {
        message = 'Report not found.'
      } else {
        message = 'An unexpected error occurred. Please try again.'
      }
      request.yar.set(SESSION_KEY, { success: false, message })
    }

    return h.redirect(resultUrl)
  }
}
