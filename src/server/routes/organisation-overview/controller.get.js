import { fetchOrganisationOverview } from '#server/common/helpers/fetch-organisation-overview.js'

export const organisationOverviewGETController = {
  async handler(request, h) {
    const id = request.params.id

    const data = await fetchOrganisationOverview(request, id)

    const unlinkResult = request.yar.get('unlinkResult')
    request.yar.clear('unlinkResult')

    const errorMessage = request.yar.get('error')
    request.yar.clear('error')

    const pageTitle = request.route.settings.app.pageTitle

    return h.view('routes/organisation-overview/index', {
      breadcrumbs: [{ text: 'Organisations', href: '/organisations' }],
      pageTitle,
      heading: data.companyName,
      organisationId: id,
      registrations: data.registrations,
      unlinkedAccreditations: data.unlinkedAccreditations,
      linkedDefraOrganisation: data.linkedDefraOrganisation,
      unlinkResult,
      error: errorMessage
    })
  }
}
