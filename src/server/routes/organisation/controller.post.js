import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { parseValidationErrors } from '#server/common/helpers/parse-validation-errors.js'

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
      const { message } = error.output.payload
      const errors = parseValidationErrors(message)

      request.yar.set('errors', errors)

      return h.redirect(`/organisations/${id}`)
    }
  }
}
