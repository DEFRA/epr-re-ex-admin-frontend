import { config } from '#config/config.js'
import { organisationsBreadcrumb } from '#server/routes/organisations/controller.js'

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

    return h.view('routes/organisation/index', {
      pageTitle: 'Organisation',
      heading: 'Organisation',
      message: 'success',
      organisationJson: JSON.stringify(data),
      breadcrumbs: [organisationsBreadcrumb]
    })
  }
}
