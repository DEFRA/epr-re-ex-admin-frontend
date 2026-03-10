import Boom from '@hapi/boom'
import { config } from '#config/config.js'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

const pollingIntervalSeconds = 3
const processingStatuses = new Set(['preprocessing', 'processing'])

export const overseasSitesImportStatusController = {
  async handler(request, h) {
    if (!config.get('features.orsEnabled')) {
      throw Boom.notFound()
    }

    const { importId } = request.params
    const pageTitle = request.route.settings.app.pageTitle

    const importData = await fetchJsonFromBackend(
      request,
      `/v1/overseas-sites/imports/${importId}`
    )

    if (processingStatuses.has(importData.status)) {
      return h.view('routes/overseas-sites-import-status/progress', {
        pageTitle,
        heading: 'Import in progress',
        message:
          'Your spreadsheet is being processed. This page will update automatically.',
        shouldPoll: true,
        pollUrl: `/overseas-sites/imports/${importId}`,
        pollingIntervalSeconds
      })
    }

    if (importData.status === 'completed') {
      return h.view('routes/overseas-sites-import-status/results', {
        pageTitle,
        heading: 'Import complete',
        files: importData.files ?? []
      })
    }

    // failed or any unexpected status
    return h.view('routes/overseas-sites-import-status/failed', {
      pageTitle,
      heading: 'Import failed',
      message:
        'There was a problem importing the spreadsheet. Please try again.',
      uploadUrl: '/overseas-sites/upload'
    })
  }
}
