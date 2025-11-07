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

    const data = await response.json()

    if (!response.ok) {
      const [errorTitle, message = data.message] = data.message.split(': ')
      const errorMessages = message.split('; ')

      request.yar.set('organisationErrors', {
        errorTitle,
        errors: errorMessages.map((err) => ({ text: err }))
      })

      return h.redirect(`/organisations/${id}`)
    }

    request.yar.set('organisationSuccess', true)

    return h.redirect(`/organisations/${id}`)
  }
}
