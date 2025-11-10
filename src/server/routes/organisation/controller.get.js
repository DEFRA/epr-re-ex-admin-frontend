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

    // Get flash messages from session
    const errors = await request.yar.get('organisationErrors')
    const success = await request.yar.get('organisationSuccess')

    // Clear flash messages after reading
    await request.yar.clear('organisationErrors')
    await request.yar.clear('organisationSuccess')

    const viewContext = {
      pageTitle: 'Organisation',
      heading: 'Organisation',
      organisationJson: JSON.stringify(data),
      breadcrumbs: [organisationsBreadcrumb]
    }

    if (errors) {
      viewContext.errorTitle = errors.errorTitle
      viewContext.errors = errors.errors
    }

    if (success) {
      viewContext.message = 'success'
    }

    return h.view('routes/organisation/index', viewContext)
  }
}
