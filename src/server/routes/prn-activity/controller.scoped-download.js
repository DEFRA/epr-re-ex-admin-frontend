import { fetchAllPrns, generateCsv } from './controller.download.js'

/**
 * Downloads PRN activity for a single accreditation as CSV. Triggered from the
 * registration overview page so a regulator can download just one org's PRNs.
 */
export const prnActivityScopedDownloadController = {
  async handler(request, h) {
    const { organisationId, registrationId, accreditationId } = request.params

    try {
      const items = await fetchAllPrns(request, accreditationId)
      const csv = await generateCsv(items)

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
