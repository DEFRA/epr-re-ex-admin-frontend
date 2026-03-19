import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import {
  auditOrsStatusCheckFailed,
  auditOrsStatusCheckSucceeded
} from '#server/common/helpers/auditing/index.js'
import { createLogger } from '#server/common/helpers/logging/logger.js'

const logger = createLogger()
const processingStatuses = new Set(['preprocessing', 'processing'])

const legacyStatusMap = new Map([
  ['pending', 'preprocessing'],
  ['complete', 'completed']
])

function normaliseStatus(status) {
  return legacyStatusMap.get(status) ?? status
}
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

function buildStatusViewModel(request, importId, data) {
  const status = normaliseStatus(data.status)
  const shouldPoll = processingStatuses.has(status)
  const resultSummary = getResultSummary(data.files)

  return {
    pageTitle: request.route.settings.app.pageTitle,
    status,
    importId,
    pollUrl: `/overseas-sites/imports/${importId}`,
    shouldPoll,
    files: data.files ?? [],
    ...resultSummary
  }
}

function auditAndLogStatusSuccess(request, importId, status) {
  auditOrsStatusCheckSucceeded({
    userSession: request.auth?.credentials,
    importId,
    status
  })

  logger.info({
    message: `Loaded ORS import status: ${importId}`,
    event: {
      category: 'data',
      action: 'status-check-succeeded',
      reference: importId
    },
    http: {
      response: {
        status_code: 200
      }
    }
  })
}

function getErrorDetails(error) {
  return {
    errorStatusCode: error?.output?.statusCode,
    errorMessage:
      error?.message ?? 'Unknown error while loading ORS import status'
  }
}

function auditAndLogStatusFailure(
  request,
  importId,
  errorStatusCode,
  errorMessage,
  error
) {
  auditOrsStatusCheckFailed({
    userSession: request.auth?.credentials,
    importId,
    errorStatusCode,
    errorMessage
  })

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
}

function buildFailureViewModel(request, importId) {
  return {
    pageTitle: request.route.settings.app.pageTitle,
    status: 'failed',
    importId,
    pollUrl: `/overseas-sites/imports/${importId}`,
    shouldPoll: false,
    files: [],
    successfulUploads: 0,
    failedUploads: 0,
    totalFiles: 0,
    error: 'There was a problem loading this upload status. Please try again.'
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
      const viewModel = buildStatusViewModel(request, importId, data)

      auditAndLogStatusSuccess(request, importId, viewModel.status)

      return h.view('routes/ors-upload/status', viewModel)
    } catch (error) {
      const { errorStatusCode, errorMessage } = getErrorDetails(error)

      auditAndLogStatusFailure(
        request,
        importId,
        errorStatusCode,
        errorMessage,
        error
      )

      return h.view(
        'routes/ors-upload/status',
        buildFailureViewModel(request, importId)
      )
    }
  }
}
