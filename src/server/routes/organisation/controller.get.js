import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

export const organisationsGETController = {
  async handler(request, h) {
    const id = request.params.id

    const data = await fetchJsonFromBackend(
      request,
      `/v1/organisations/${id}`,
      {}
    )

    // Get flash messages from session
    const errorList = request.yar.get('errorList')
    const successMessage = request.yar.get('success')

    // Clear flash messages after reading
    await request.yar.clear('errorList')
    await request.yar.clear('success')

    const pageTitle = request.route.settings.app.pageTitle

    const viewContext = {
      pageTitle,
      heading: data.companyDetails.name,
      organisationJson: JSON.stringify(data)
    }

    if (errorList?.length) {
      viewContext.errorList = errorList
    }

    if (successMessage) {
      viewContext.message = 'success'
    }

    return h.view('routes/organisation/index', viewContext)
  }
}
