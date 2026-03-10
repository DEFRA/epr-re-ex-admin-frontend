import Boom from '@hapi/boom'
import { config } from '#config/config.js'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

export const overseasSitesUploadController = {
  async handler(request, h) {
    if (!config.get('features.orsEnabled')) {
      throw Boom.notFound()
    }

    const appBaseUrl = config.get('appBaseUrl')
    const redirectUrl = `${appBaseUrl}/overseas-sites/imports/{importId}`

    const { uploadUrl } = await fetchJsonFromBackend(
      request,
      '/v1/overseas-sites/imports',
      {
        method: 'POST',
        body: JSON.stringify({ redirectUrl })
      }
    )

    const pageTitle = request.route.settings.app.pageTitle

    return h.view('routes/overseas-sites-upload/index', {
      pageTitle,
      heading: pageTitle,
      uploadUrl
    })
  }
}
