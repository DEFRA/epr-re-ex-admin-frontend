import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { createLogger } from '#server/common/helpers/logging/logger.js'
import { statusCodes } from '#server/common/constants/status-codes.js'
import { orsUploadRoutes } from './constants.js'

const logger = createLogger()

function getUploadInitiationErrorMessage(error) {
  switch (error?.output?.statusCode) {
    case statusCodes.notFound:
      return 'ORS upload is not available yet because the backend initiate-import endpoint is not enabled.'
    case statusCodes.unauthorised:
      return 'Your session has expired. Please sign in again and retry.'
    case statusCodes.forbidden:
      return 'You do not have permission to start ORS uploads.'
    case statusCodes.badRequest:
      return 'ORS upload could not be started due to invalid upload redirect configuration.'
    default:
      console.log(error)
      return 'There was a problem starting the ORS upload. Please refresh and try again.'
  }
}

export const orsUploadGetController = {
  async handler(request, h) {
    const redirectUrl = orsUploadRoutes.uploadStatus

    try {
      const { uploadUrl } = await fetchJsonFromBackend(
        request,
        '/v1/overseas-sites/imports',
        {
          method: 'POST',
          body: JSON.stringify({ redirectUrl })
        }
      )

      return h.view('routes/ors-upload/upload', {
        pageTitle: request.route.settings.app.pageTitle,
        uploadUrl,
        error: null
      })
    } catch (error) {
      logger.error({
        err: error,
        message: 'Failed to initiate ORS workbook upload'
      })

      return h.view('routes/ors-upload/upload', {
        pageTitle: request.route.settings.app.pageTitle,
        uploadUrl: null,
        error: getUploadInitiationErrorMessage(error)
      })
    }
  }
}
