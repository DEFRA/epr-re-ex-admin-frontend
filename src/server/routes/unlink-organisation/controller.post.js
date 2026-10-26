import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { organisationPath } from '#server/common/helpers/backend-paths.js'
import { organisationOverviewUrl } from '#server/common/helpers/page-urls.js'

export const unlinkOrganisationPostController = {
  async handler(request, h) {
    const { organisationNumber } = request.params

    try {
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

    return h.redirect(organisationOverviewUrl({ organisationNumber }))
  }
}
