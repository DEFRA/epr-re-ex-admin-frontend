import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { buildBackendPath, mapLinkedOrganisations } from './helpers.js'

export const linkedOrganisationsController = {
  async handler(request, h) {
    const searchTerm = request.query.search?.trim() || ''
    const errorMessage = request.yar.get('error')
    await request.yar.clear('error')

    const data = await fetchJsonFromBackend(
      request,
      buildBackendPath(searchTerm)
    )
    const linkedOrganisations = mapLinkedOrganisations(data)

    return h.view('routes/linked-organisations/index', {
      pageTitle: request.route.settings.app.pageTitle,
      searchTerm,
      linkedOrganisations,
      error: errorMessage
    })
  }
}
