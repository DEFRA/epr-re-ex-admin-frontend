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

    // Safely serialise JSON for embedding in a script tag
    const safeJson = JSON.stringify(data)
      .replace(/</g, '\\u003c')
      .replace(/-->/g, '--\\u003e')
      .replace(/\u2028/g, '\\u2028')
      .replace(/\u2029/g, '\\u2029')

    return h.view('routes/organisation/index', {
      pageTitle: 'Organisation',
      heading: 'Organisation',
      organisationJson: safeJson,
      breadcrumbs: [organisationsBreadcrumb]
    })
  }
}
