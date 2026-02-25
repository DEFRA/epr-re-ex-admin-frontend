import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

export const organisationsPOSTController = {
  async handler(request, h) {
    const id = request.params.id

    const postedData = JSON.parse(request.payload.organisation)

    try {
      await fetchJsonFromBackend(request, `/v1/organisations/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          version: postedData.version,
          updateFragment: postedData
        })
      })

      request.yar.set('success', true)

      return h.redirect(`/organisations/${id}`)
    } catch (error) {
      const message =
        error.output?.payload?.message ?? 'An unknown error occurred'
      const errorList = message.split('; ').map((text) => ({ text }))

      request.yar.set('errorList', errorList)

      return h.redirect(`/organisations/${id}`)
    }
  }
}
