import {
  fetchOrganisationView,
  registrationRows
} from '#server/common/helpers/fetch-organisation-view.js'
import {
  registrationOverviewUrl,
  unlinkDefraIdUrl
} from '#server/common/helpers/page-urls.js'

/**
 * @import { LinkedDefraOrganisationView } from '#server/common/helpers/fetch-organisation-view.js'
 */

/**
 * The linked Defra ID organisation as the template reads it.
 * @param {LinkedDefraOrganisationView} [linked]
 */
const toLinkedDefraOrganisation = (linked) =>
  linked && {
    orgName: linked.defraOrganisation.name,
    orgId: linked.defraOrganisation.id,
    linkedAt: linked.linkedAt,
    linkedBy: { email: linked.linkedBy.email }
  }

export const organisationOverviewGETController = {
  async handler(request, h) {
    const { organisationNumber } = request.params

    const organisation = await fetchOrganisationView(
      request,
      organisationNumber
    )

    const unlinkResult = request.yar.get('unlinkResult')
    request.yar.clear('unlinkResult')

    const pageTitle = request.route.settings.app.pageTitle

    return h.view('routes/organisation-overview/index', {
      breadcrumbs: [{ text: 'Organisations', href: '/organisations' }],
      pageTitle,
      heading: organisation.name,
      registrations: registrationRows(organisation).map((row) => ({
        ...row,
        viewUrl: registrationOverviewUrl({
          organisationNumber,
          registrationNumber: row.registrationNumber
        })
      })),
      linkedDefraOrganisation: toLinkedDefraOrganisation(
        organisation.linkedDefraOrganisation
      ),
      unlinkUrl: `${unlinkDefraIdUrl({ organisationNumber })}/confirm`,
      unlinkResult
    })
  }
}
