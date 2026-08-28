import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

/**
 * Renders the whole stored summary log document as pretty-printed JSON for
 * support triage. The backend /document endpoint returns the document as
 * stored (including loadsByReportingPeriod), so the page dumps it verbatim
 * rather than reshaping - the raw view is the point.
 *
 * A missing log surfaces as the backend's 404, which propagates to the
 * standard not-found page; a backend 403 (caller lacks summary-log.read /
 * organisation.read) renders the standard forbidden page. Neither is caught
 * here.
 */
export const summaryLogDocumentGetController = {
  async handler(request, h) {
    const { organisationId, registrationId, summaryLogId } = request.params

    const summaryLog = await fetchJsonFromBackend(
      request,
      `/v1/organisations/${organisationId}/registrations/${registrationId}/summary-logs/${summaryLogId}/document`
    )

    return h.view('routes/summary-log-document/index', {
      pageTitle: request.route.settings.app.pageTitle,
      breadcrumbs: [
        { text: 'Organisations', href: '/organisations' },
        {
          text: 'Registration overview',
          href: `/organisations/${organisationId}/registrations/${registrationId}/overview`
        }
      ],
      summaryLog
    })
  }
}
