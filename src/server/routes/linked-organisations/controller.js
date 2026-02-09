import Joi from 'joi'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

function mapLinkedOrganisations(data) {
  return (Array.isArray(data) ? data : []).map(
    ({
      orgId,
      companyDetails: { name, registrationNumber },
      linkedDefraOrganisation: {
        orgId: defraOrgId,
        orgName,
        linkedAt,
        linkedBy
      }
    }) => ({
      eprOrgName: name,
      eprOrgId: orgId,
      registrationNumber,
      defraOrgName: orgName,
      defraOrgId,
      linkedAt,
      linkedByEmail: linkedBy.email
    })
  )
}

function buildBackendPath(searchTerm) {
  if (searchTerm) {
    return `/v1/linked-organisations?name=${encodeURIComponent(searchTerm)}`
  }
  return '/v1/linked-organisations'
}

export const linkedOrganisationsController = {
  options: {
    validate: {
      query: Joi.object({
        search: Joi.string().optional().allow('').trim()
      })
    }
  },
  async handler(request, h) {
    const searchTerm = request.query.search?.trim() || ''
    const errorMessage = request.yar.get('error')
    request.yar.clear('error')

    const data = await fetchJsonFromBackend(
      request,
      buildBackendPath(searchTerm)
    )
    const linkedOrganisations = mapLinkedOrganisations(data)

    return h.view('routes/linked-organisations/index', {
      pageTitle: request.route.settings.app.pageTitle,
      searchTerm,
      linkedOrganisations,
      error: errorMessage
    })
  }
}
