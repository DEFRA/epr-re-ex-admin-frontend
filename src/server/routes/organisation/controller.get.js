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
    const errors = request.yar.get('errors')
    const successMessage = request.yar.get('success')

    // Clear flash messages after reading
    await request.yar.clear('errors')
    await request.yar.clear('success')

    const pageTitle = request.route.settings.app.pageTitle

    const viewContext = {
      pageTitle,
      heading: data.companyDetails.name,
      organisationJson: JSON.stringify(data)
    }

    if (errors?.length) {
      viewContext.errorList = errors.map((e) => ({ text: e.message }))
    }

    if (successMessage) {
      viewContext.message = 'success'
    }

    return h.view('routes/organisation/index', viewContext)
  }
}
