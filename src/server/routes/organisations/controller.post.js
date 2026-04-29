import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { toSlimOrganisation } from './helpers.js'
import { PAGE_SIZE, buildPaginationLinks } from './pagination.js'

export const organisationsPostController = {
  async handler(request, h) {
    const searchTerm = request.payload.search.trim()

    const params = new URLSearchParams({
      page: '1',
      pageSize: String(PAGE_SIZE)
    })

    if (searchTerm) {
      params.set('search', searchTerm)
    }

    const data = await fetchJsonFromBackend(
      request,
      `/v1/organisations?${params}`
    )

    const pageTitle = request.route.settings.app.pageTitle

    return h.view('routes/organisations/index', {
      pageTitle,
      heading: pageTitle,
      searchTerm,
      organisations: data.items.map(toSlimOrganisation),
      pagination: buildPaginationLinks({
        page: data.page,
        totalPages: data.totalPages,
        searchTerm
      })
    })
  }
}
