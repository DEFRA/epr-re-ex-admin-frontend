import { config } from '#config/config.js'
import { organisationsBreadcrumb } from '#server/routes/organisations/controller.js'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

export const organisationsPOSTController = {
  async handler(request, h) {
    const id = request.params.id

    const postedData = JSON.parse(request.payload.organisation)
    const eprBackendUrl = config.get('eprBackendUrl')

    const response = await fetch(`${eprBackendUrl}/v1/organisations/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: postedData.version,
        updateFragment: postedData
      })
    })

    const data = await response.json()

    if (!response.ok) {
      // Return original JSON to the frontend for change highlighting
      const originalData = await fetchJsonFromBackend(
        request,
        `/v1/organisations/${id}`,
        {}
      )

      const [errorTitle, message = data.message] = data.message.split(': ')
      const errorMessages = message.split('; ')

      return h.view('routes/organisation/index', {
        pageTitle: 'Organisation',
        heading: 'Organisation',
        errorTitle,
        errors: errorMessages.map((err) => ({ text: err })),
        organisationJson: JSON.stringify(originalData),
        breadcrumbs: [organisationsBreadcrumb]
      })
    }

    return h.view('routes/organisation/index', {
      pageTitle: 'Organisation',
      heading: 'Organisation',
      message: 'success',
      organisationJson: JSON.stringify(data),
      breadcrumbs: [organisationsBreadcrumb]
    })
  }
}
