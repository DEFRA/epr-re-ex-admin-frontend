import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { createLogger } from '#server/common/helpers/logging/logger.js'

const logger = createLogger()
const processingStatuses = new Set(['preprocessing', 'processing'])

function getResultSummary(files = []) {
  const successfulUploads = files.filter(
    (file) => file.result?.status === 'success'
  ).length
  const failedUploads = files.filter(
    (file) => file.result?.status === 'failure'
  ).length

  return {
    successfulUploads,
    failedUploads,
    totalFiles: files.length
  }
}

export const orsUploadStatusGetController = {
  async handler(request, h) {
    const { importId } = request.params

    try {
      const data = await fetchJsonFromBackend(
        request,
        `/v1/overseas-sites/imports/${importId}`
      )

      const shouldPoll = processingStatuses.has(data.status)
      const resultSummary = getResultSummary(data.files)

      return h.view('routes/ors-upload/status', {
        pageTitle: request.route.settings.app.pageTitle,
        status: data.status,
        importId,
        pollUrl: `/overseas-sites/imports/${importId}`,
        shouldPoll,
        files: data.files ?? [],
        ...resultSummary
      })
    } catch (error) {
      logger.error({
        err: error,
        message: `Failed to load ORS import status: ${importId}`
      })

      return h.view('routes/ors-upload/status', {
        pageTitle: request.route.settings.app.pageTitle,
        status: 'failed',
        importId,
        pollUrl: `/overseas-sites/imports/${importId}`,
        shouldPoll: false,
        files: [],
        successfulUploads: 0,
        failedUploads: 0,
        totalFiles: 0,
        error:
          'There was a problem loading this upload status. Please try again.'
      })
    }
  }
}
