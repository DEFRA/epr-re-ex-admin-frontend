import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { organisationsBreadcrumb } from '#server/routes/organisations/controller.js'

export const organisationsGETController = {
  async handler(request, h) {
    const id = request.params.id

    const data = await fetchJsonFromBackend(
      request,
      `/v1/organisations/${id}`,
      {}
    )

    return h.view('routes/organisation/index', {
      pageTitle: 'Organisation',
      heading: 'Organisation',
      organisationData: data,
      organisationId: id,
      breadcrumbs: [organisationsBreadcrumb]
    })
  }
}
