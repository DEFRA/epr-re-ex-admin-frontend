import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { createLogger } from '#server/common/helpers/logging/logger.js'

const logger = createLogger()

function getUploadInitiationErrorMessage(error) {
  switch (error?.output?.statusCode) {
    case 404:
      return 'ORS upload is not available yet because the backend initiate-import endpoint is not enabled.'
    case 401:
      return 'Your session has expired. Please sign in again and retry.'
    case 403:
      return 'You do not have permission to start ORS uploads.'
    case 400:
      return 'ORS upload could not be started due to invalid upload redirect configuration.'
    default:
      return 'There was a problem starting the ORS upload. Please refresh and try again.'
  }
}

export const orsUploadGetController = {
  async handler(request, h) {
    const redirectUrl = '/overseas-sites/imports/{importId}'

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
