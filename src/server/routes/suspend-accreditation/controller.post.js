import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

export const suspendAccreditationPostController = {
  async handler(request, h) {
    const { organisationId, registrationId, accreditationId } = request.params
    const overviewUrl = `/organisations/${organisationId}/registrations/${registrationId}/overview`

    try {
      await fetchJsonFromBackend(
        request,
        `/v1/organisations/${organisationId}/registrations/${registrationId}/accreditations/${accreditationId}/suspend`,
        { method: 'PATCH' }
      )
    } catch (error) {
      request.logger.error({
        err: error,
        message: 'Suspend accreditation failed'
      })

      const errorMessage =
        error.output?.payload?.message ||
        'There was a problem suspending the accreditation. Please try again.'

      request.yar.set('error', errorMessage)
    }

    return h.redirect(overviewUrl)
  }
}
