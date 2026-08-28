import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { statusCodes } from '#server/common/constants/status-codes.js'

/**
 * Renders the whole stored summary log document as pretty-printed JSON for
 * support triage. The backend /document endpoint returns the document as
 * stored (including loadsByReportingPeriod), so the page dumps it verbatim
 * rather than reshaping - the raw view is the point.
 */
export const summaryLogDocumentGetController = {
  async handler(request, h) {
    const { organisationId, registrationId, summaryLogId } = request.params

    const viewModel = {
      pageTitle: request.route.settings.app.pageTitle,
      breadcrumbs: [
        { text: 'Organisations', href: '/organisations' },
        {
          text: 'Registration overview',
          href: `/organisations/${organisationId}/registrations/${registrationId}/overview`
        }
      ],
      organisationId,
      registrationId,
      summaryLogId
    }

    try {
      const summaryLog = await fetchJsonFromBackend(
        request,
        `/v1/organisations/${organisationId}/registrations/${registrationId}/summary-logs/${summaryLogId}/document`
      )

      return h.view('routes/summary-log-document/index', {
        ...viewModel,
        summaryLog
      })
    } catch (error) {
      if (error.isBoom && error.output?.statusCode === statusCodes.notFound) {
        return h
          .view('routes/summary-log-document/index', {
            ...viewModel,
            summaryLog: null
          })
          .code(statusCodes.notFound)
      }

      throw error
    }
  }
}
