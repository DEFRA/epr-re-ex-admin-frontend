import { config } from '#config/config.js'

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

    if (!response.ok) {
      console.error('Failed to update organisation:', response.statusText)
      return h.view('500')
    }

    // Redirect back to the GET page after successful update
    // When JSONEditor form is added, this can show a success message via query param or flash message
    return h.redirect(`/organisations/${id}`)
  }
}
