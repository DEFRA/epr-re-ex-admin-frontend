import { fetchOrganisationView } from '#server/common/helpers/fetch-organisation-view.js'
import {
  organisationOverviewUrl,
  unlinkDefraIdUrl
} from '#server/common/helpers/page-urls.js'

export const unlinkOrganisationConfirmGetController = {
  async handler(request, h) {
    const { organisationNumber } = request.params
    const overviewUrl = organisationOverviewUrl({ organisationNumber })

    const organisation = await fetchOrganisationView(
      request,
      organisationNumber
    )

    if (!organisation.linkedDefraOrganisation) {
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
      postUrl: unlinkDefraIdUrl({ organisationNumber }),
      companyName: organisation.name,
      defraOrgName: organisation.linkedDefraOrganisation.defraOrganisation.name
    })
  }
}
