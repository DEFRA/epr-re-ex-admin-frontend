import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

export const organisationsPOSTController = {
  async handler(request, h) {
    const id = request.params.id

    const postedData = JSON.parse(request.payload.organisation)

    try {
      await fetchJsonFromBackend(request, `/v1/organisations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          version: postedData.version,
          updateFragment: postedData
        })
      })

      request.yar.set('success', true)

      return h.redirect(`/organisations/${id}`)
    } catch (error) {
      request.yar.set('error', error.output.payload.message)

      return h.redirect(`/organisations/${id}`)
    }
  }
}
