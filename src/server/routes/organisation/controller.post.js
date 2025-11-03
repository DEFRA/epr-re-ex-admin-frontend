import { config } from '#config/config.js'
import { organisationsBreadcrumb } from '#server/routes/organisations/controller.js'

export const organisationsPOSTController = {
  async handler(request, h) {
    const id = request.params.id

    const postedData = JSON.parse(request.payload.organisation)
    const eprBackendUrl = config.get('eprBackendUrl')

    let response
    try {
      response = await fetch(`${eprBackendUrl}/v1/organisations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          version: postedData.version,
          updateFragment: postedData
        })
      })
    } catch (error) {
      console.error('Failed to update organisation:', error)
      return h.view('500')
    }

    if (!response.ok) {
      console.error('Failed to update organisation:', response.statusText)
      return h.view('500')
    }

    const data = await response.json()

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
      message: 'success',
      breadcrumbs: [organisationsBreadcrumb]
    })
  }
}
