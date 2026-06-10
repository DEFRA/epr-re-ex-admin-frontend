import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

export const unlinkOrganisationPostController = {
  async handler(request, h) {
    const { organisationId } = request.params
    const overviewUrl = `/organisations/${organisationId}/overview`

    try {
      await fetchJsonFromBackend(
        request,
        `/v1/organisations/${organisationId}/link`,
        { method: 'DELETE' }
      )
      request.yar.set('unlinkResult', 'success')
    } catch (error) {
      request.logger.error({
        err: error,
        message: 'Unlink organisation from Defra ID failed'
      })
      request.yar.set('unlinkResult', 'error')
    }

    return h.redirect(overviewUrl)
  }
}
