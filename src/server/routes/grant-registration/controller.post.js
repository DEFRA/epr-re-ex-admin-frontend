import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { findRegistration } from '#server/common/helpers/fetch-organisation-overview.js'
import { statusCodes } from '#server/common/constants/status-codes.js'
import { PAGE_TITLE } from './constants.js'

const CONFLICT_MESSAGE =
  'This record changed since you opened it. Reload the page and try again.'

/**
 * Re-render the confirm page with an error summary, re-reading the org for a
 * fresh version and the registration number.
 */
const renderConfirmWithError = async (
  request,
  h,
  { organisationId, registrationId, reason, reasonError, summaryErrors }
) => {
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

  return h.view('routes/grant-registration/confirm', {
    pageTitle: PAGE_TITLE,
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
    reason,
    reasonError,
    errors: summaryErrors
  })
}

/**
 * POST handler: grant the registration (status `created → approved`).
 */
export const grantRegistrationPostController = {
  async handler(request, h) {
    const { organisationId, registrationId } = request.params
    const overviewUrl = `/organisations/${organisationId}/registrations/${registrationId}/overview`
    const { reason, version } = request.payload
    const trimmedReason = reason.trim()

    if (!trimmedReason) {
      return renderConfirmWithError(request, h, {
        organisationId,
        registrationId,
        reason: '',
        reasonError: { text: 'Enter a reason for this change' },
        summaryErrors: [
          { text: 'Enter a reason for this change', href: '#reason' }
        ]
      })
    }

    try {
      await fetchJsonFromBackend(
        request,
        `/v1/organisations/${organisationId}/registrations/${registrationId}/status-history`,
        {
          method: 'POST',
          body: JSON.stringify({
            status: 'approved',
            reason: trimmedReason,
            version: Number(version)
          })
        }
      )
      request.yar.set('grantResult', { status: 'success' })
      return h.redirect(overviewUrl)
    } catch (error) {
      request.logger.error({ err: error, message: 'Grant registration failed' })

      const isConflict = error.output.statusCode === statusCodes.conflict
      const message = isConflict
        ? CONFLICT_MESSAGE
        : error.output.payload.message

      return renderConfirmWithError(request, h, {
        organisationId,
        registrationId,
        reason: trimmedReason,
        reasonError: null,
        summaryErrors: [{ text: message }]
      })
    }
  }
}
