import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { findRegistration } from '#server/common/helpers/fetch-organisation-overview.js'
import { renderConfirm } from './render-confirm.js'

/**
 * GET the "Approve registration" confirmation page. Fetches the full
 * organisation (for the whole-org `version` and the registration's current
 * status), and only renders the form when the registration is still `created`.
 */
export const grantRegistrationConfirmGetController = {
  async handler(request, h) {
    const { organisationId, registrationId } = request.params
    const overviewUrl = `/organisations/${organisationId}/registrations/${registrationId}/overview`

    const organisation = await fetchJsonFromBackend(
      request,
      `/v1/organisations/${organisationId}`,
      {}
    )

    const registration = findRegistration(
      organisation,
      organisationId,
      registrationId
    )

    if (registration.status !== 'created') {
      return h.redirect(overviewUrl)
    }

    return renderConfirm(h, {
      organisationId,
      registrationId,
      overviewUrl,
      version: organisation.version,
      reason: '',
      reasonError: null,
      errors: null
    })
  }
}
