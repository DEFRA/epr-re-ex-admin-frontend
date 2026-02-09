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

export const linkedOrganisationsGetController = {
  async handler(request, h) {
    const errorMessage = request.yar.get('error')
    await request.yar.clear('error')

    const data = await fetchJsonFromBackend(request, '/v1/linked-organisations')

    const linkedOrganisations = mapLinkedOrganisations(data)

    return h.view('routes/linked-organisations/index', {
      pageTitle: request.route.settings.app.pageTitle,
      linkedOrganisations,
      error: errorMessage
    })
  }
}
