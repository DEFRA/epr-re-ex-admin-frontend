import {
  fetchOrganisationOverview,
  findUnlinkedAccreditation
} from '#server/common/helpers/fetch-organisation-overview.js'
import { buildAssignView } from './assign-view.js'

export const accreditationAssignGetController = {
  async handler(request, h) {
    const { organisationId, accreditationId } = request.params

    const overview = await fetchOrganisationOverview(request, organisationId)
    const accreditation = findUnlinkedAccreditation(
      overview,
      organisationId,
      accreditationId
    )

    return h.view(
      'routes/accreditation-assign/confirm',
      buildAssignView(request.params, accreditation, overview.registrations)
    )
  }
}
