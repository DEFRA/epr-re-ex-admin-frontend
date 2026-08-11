import { statusCodes } from '#server/common/constants/status-codes.js'
import {
  fetchOrganisationOverview,
  findUnlinkedAccreditation
} from '#server/common/helpers/fetch-organisation-overview.js'
import { postStatusTransition } from '#server/common/helpers/status-transition/post-status-transition.js'
import { buildAssignView } from './assign-view.js'

const CONFIRM_VIEW = 'routes/accreditation-assign/confirm'

const ASSIGN_ERROR_COPY = {
  errorMessage:
    'There was a problem assigning the accreditation to the registration. Please try again.',
  logMessage: 'Assign accreditation to registration failed'
}

export const accreditationAssignPostController = {
  async handler(request, h) {
    const { organisationId, accreditationId } = request.params
    const overviewUrl = `/organisations/${organisationId}/overview`

    const registrationId = (request.payload.registrationId ?? '').trim()

    // The overview is needed on every path but the redirect: both re-renders
    // rebuild the candidate list from it, and it is what proves the
    // accreditation is still unassigned.
    const overview = await fetchOrganisationOverview(request, organisationId)
    const accreditation = findUnlinkedAccreditation(
      overview,
      organisationId,
      accreditationId
    )

    if (!registrationId) {
      return h
        .view(
          CONFIRM_VIEW,
          buildAssignView(
            request.params,
            accreditation,
            overview.registrations,
            {
              error: 'Select a registration'
            }
          )
        )
        .code(statusCodes.badRequest)
    }

    const outcome = await postStatusTransition(
      request,
      `/v1/organisations/${organisationId}/accreditations/${accreditationId}/registration`,
      { registrationId },
      ASSIGN_ERROR_COPY,
      { registrationId }
    )

    if (outcome) {
      return h
        .view(
          CONFIRM_VIEW,
          buildAssignView(
            request.params,
            accreditation,
            overview.registrations,
            {
              registrationId,
              backendError: outcome.backendError
            }
          )
        )
        .code(statusCodes.badRequest)
    }

    return h.redirect(overviewUrl)
  }
}
