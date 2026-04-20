import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

export const reportDetailGETController = {
  async handler(request, h) {
    const { organisationId, registrationId, year, cadence, period } =
      request.params

    const data = await fetchJsonFromBackend(
      request,
      `/v1/organisations/${organisationId}/registrations/${registrationId}/reports/${year}/${cadence}/${period}`,
      {}
    )

    const pageTitle = request.route.settings.app.pageTitle

    return h.view('routes/reports/index', {
      breadcrumbs: [
        { text: 'Organisations', href: '/organisations' },
        { text: 'Overview', href: `/organisations/${organisationId}/overview` },
        {
          text: 'Registration reports',
          href: `/organisations/${organisationId}/registrations/${registrationId}/reports`
        }
      ],
      pageTitle,
      heading: pageTitle,
      reportJson: JSON.stringify(data, null, 2)
    })
  }
}
