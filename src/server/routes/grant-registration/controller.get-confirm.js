import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { findRegistration } from '#server/common/helpers/fetch-organisation-overview.js'
import { PAGE_TITLE } from './constants.js'

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

    return h.view('routes/grant-registration/confirm', {
      pageTitle: request.route.settings.app.pageTitle,
      heading: PAGE_TITLE,
      breadcrumbs: [
        { text: 'Organisations', href: '/organisations' },
        {
          text: 'Organisation overview',
          href: `/organisations/${organisationId}/overview`
        },
        { text: 'Registration overview', href: overviewUrl }
      ],
      overviewUrl,
      postUrl: `/organisations/${organisationId}/registrations/${registrationId}/approve`,
      registrationNumber: registration.registrationNumber,
      version: organisation.version,
      reason: '',
      reasonError: null,
      errors: null
    })
  }
}
