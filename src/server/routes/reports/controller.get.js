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
    const heading = `Report – ${year} ${cadence} period ${period}`

    return h.view('routes/reports/index', {
      breadcrumbs: [
        { text: 'Organisations', href: '/organisations' },
        {
          text: 'Organisation overview',
          href: `/organisations/${organisationId}/overview`
        },
        {
          text: 'Registration overview',
          href: `/organisations/${organisationId}/registrations/${registrationId}/overview`
        }
      ],
      pageTitle,
      heading,
      reportJson: JSON.stringify(data, null, 2)
    })
  }
}
