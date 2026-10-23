import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { fetchOrganisationOverview } from '#server/common/helpers/fetch-organisation-overview.js'
import { organisationPath } from '#server/common/helpers/backend-paths.js'

export const unlinkOrganisationPostController = {
  async handler(request, h) {
    const { organisationId } = request.params
    const overviewUrl = `/organisations/${organisationId}/overview`

    try {
      const { organisationNumber } = await fetchOrganisationOverview(
        request,
        organisationId
      )
      await fetchJsonFromBackend(
        request,
        `${organisationPath({ organisationNumber })}/link`,
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
