import { fetchOrganisationOverview } from '#server/common/helpers/fetch-organisation-overview.js'

export const organisationOverviewGETController = {
  async handler(request, h) {
    const id = request.params.id

    const data = await fetchOrganisationOverview(request, id)

    const pageTitle = request.route.settings.app.pageTitle

    return h.view('routes/organisation-overview/index', {
      breadcrumbs: [{ text: 'Organisations', href: '/organisations' }],
      pageTitle,
      heading: data.companyName,
      organisationId: id,
      registrations: data.registrations
    })
  }
}
