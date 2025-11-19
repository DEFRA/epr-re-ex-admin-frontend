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
    const errorMessage = request.yar.get('error')
    const successMessage = request.yar.get('success')

    // Clear flash messages after reading
    await request.yar.clear('error')
    await request.yar.clear('success')

    const viewContext = {
      pageTitle: 'Organisation Details',
      heading: data.companyDetails.name,
      organisationJson: JSON.stringify(data),
      breadcrumbs: [organisationsBreadcrumb]
    }

    if (errorMessage) {
      viewContext.error = errorMessage
    }

    if (successMessage) {
      viewContext.message = 'success'
    }

    return h.view('routes/organisation/index', viewContext)
  }
}
