import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { statusCodes } from '#server/common/constants/status-codes.js'

export const suspendAccreditationPostController = {
  async handler(request, h) {
    const { organisationId, registrationId, accreditationId } = request.params
    const overviewUrl = `/organisations/${organisationId}/registrations/${registrationId}/overview`

    try {
      await fetchJsonFromBackend(
        request,
        `/v1/organisations/${organisationId}/registrations/${registrationId}/accreditations/${accreditationId}/status-history`,
        { method: 'POST', body: JSON.stringify({ status: 'suspended' }) }
      )
    } catch (error) {
      request.logger.error({
        err: error,
        message: 'Suspend accreditation failed'
      })

      // Only surface backend messages for client errors: 5xx and network
      // failures carry Boom's generic message (or the raw fetch error, which
      // leaks the backend URL), so those get the friendly fallback instead.
      const { statusCode, payload } = error.output
      const errorMessage =
        (statusCode < statusCodes.internalServerError && payload.message) ||
        'There was a problem suspending the accreditation. Please try again.'

      request.yar.set('error', errorMessage)
    }

    return h.redirect(overviewUrl)
  }
}
