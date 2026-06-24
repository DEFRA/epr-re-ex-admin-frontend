import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { findRegistration } from '#server/common/helpers/fetch-organisation-overview.js'
import { statusCodes } from '#server/common/constants/status-codes.js'
import { renderConfirm } from './render-confirm.js'

const CONFLICT_MESSAGE =
  'This record changed since you opened it. Reload the page and try again.'
const GENERIC_MESSAGE = 'The registration could not be approved. Try again.'

/**
 * Re-render the confirm page with an error summary, re-reading the org for a
 * fresh version and the registration number.
 *
 * @param {import('@hapi/hapi').Request} request
 * @param {import('@hapi/hapi').ResponseToolkit} h
 * @param {{ organisationId: string, registrationId: string, reason: string, reasonError: object | null, summaryErrors: Array<{text: string, href?: string}> }} options
 * @returns {Promise<import('@hapi/hapi').ResponseObject>}
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

  return renderConfirm(h, {
    organisationId,
    registrationId,
    overviewUrl,
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
    const trimmedReason = (reason ?? '').trim()

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
        : (error.output.payload?.message ?? GENERIC_MESSAGE)

      return renderConfirmWithError(request, h, {
        organisationId,
        registrationId,
        reason: trimmedReason,
        reasonError: null,
        summaryErrors: message.split('; ').map((text) => ({ text }))
      })
    }
  }
}
