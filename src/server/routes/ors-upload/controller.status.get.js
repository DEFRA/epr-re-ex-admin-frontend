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

function getErrorDetails(error) {
  return {
    errorStatusCode: error?.output?.statusCode,
    errorMessage:
      error?.message ?? 'Unknown error while loading ORS import status'
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

      logger.info({
        message: `Loaded ORS import status: ${importId}`,
        event: {
          category: 'data',
          action: 'status-check-succeeded',
          reference: importId,
          status: data.status
        },
        http: {
          response: {
            status_code: 200
          }
        }
      })

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
      const { errorStatusCode, errorMessage } = getErrorDetails(error)

      logger.error({
        err: error,
        message: `Failed to load ORS import status: ${importId}`,
        event: {
          category: 'data',
          action: 'status-check-failed',
          reference: importId,
          reason: errorMessage
        },
        http: {
          response: {
            status_code: errorStatusCode
          }
        }
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
