import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

export const organisationsPOSTController = {
  async handler(request, h) {
    const id = request.params.id

    const postedData = JSON.parse(request.payload.organisation)

    const response = await fetchJsonFromBackend(
      request,
      `/v1/organisations/${id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          version: postedData.version,
          updateFragment: postedData
        })
      }
    )

    console.log(response)

    const data = await response.json()

    if (!response.ok) {
      request.yar.set('organisationError', data.message)

      return h.redirect(`/organisations/${id}`)
    }

    request.yar.set('organisationSuccess', true)

    return h.redirect(`/organisations/${id}`)
  }
}
