import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { toStatusTables } from './status-tables.js'

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
    // A failed status change, flashed by the status-change pages
    const statusChangeError = request.yar.get('error')

    // Clear flash messages after reading
    await request.yar.clear('errorList')
    await request.yar.clear('success')
    await request.yar.clear('error')

    const pageTitle = request.route.settings.app.pageTitle

    /** @type {Record<string, unknown>} */
    const viewContext = {
      pageTitle,
      heading: data.companyDetails.name,
      organisationJson: JSON.stringify(data),
      statusChangeError,
      ...toStatusTables(data)
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
