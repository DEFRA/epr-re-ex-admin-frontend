import { fetchOrganisationOverview } from '#server/common/helpers/fetch-organisation-overview.js'

export const unlinkOrganisationConfirmGetController = {
  async handler(request, h) {
    const { organisationId } = request.params
    const overviewUrl = `/organisations/${organisationId}/overview`

    const overview = await fetchOrganisationOverview(request, organisationId)

    if (!overview.linkedDefraOrganisation) {
      return h.redirect(overviewUrl)
    }

    return h.view('routes/unlink-organisation/confirm', {
      pageTitle: request.route.settings.app.pageTitle,
      heading: 'Unlink organisation from Defra ID',
      breadcrumbs: [
        { text: 'Organisations', href: '/organisations' },
        { text: 'Organisation overview', href: overviewUrl }
      ],
      overviewUrl,
      postUrl: `/organisations/${organisationId}/unlink-defra-id`,
      companyName: overview.companyName,
      defraOrgName: overview.linkedDefraOrganisation.orgName
    })
  }
}
