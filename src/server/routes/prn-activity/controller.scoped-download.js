import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { generateCsv } from './controller.download.js'
import { buildAccreditationPrnApiUrl } from './controller.js'

/**
 * Downloads PRN activity for a single accreditation as CSV. Triggered from the
 * registration overview page so a regulator can download just one org's PRNs.
 */
export const prnActivityScopedDownloadController = {
  async handler(request, h) {
    const { organisationId, registrationId, accreditationId } = request.params

    try {
      const data = await fetchJsonFromBackend(
        request,
        buildAccreditationPrnApiUrl({
          organisationId,
          registrationId,
          accreditationId
        })
      )
      const csv = await generateCsv(data?.items || [])

      return h
        .response(csv)
        .header('Content-Type', 'text/csv')
        .header(
          'Content-Disposition',
          `attachment; filename="prn-activity-${accreditationId}.csv"`
        )
    } catch (error) {
      const errorMessage =
        error.output?.payload?.message ||
        'There was a problem downloading the PRN activity data. Please try again.'

      request.yar.set('error', errorMessage)

      return h.redirect(
        `/organisations/${organisationId}/registrations/${registrationId}/overview`
      )
    }
  }
}
