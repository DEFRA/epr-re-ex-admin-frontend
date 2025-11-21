import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

export const organisationsController = {
  async handler(request, h) {
    const searchTerm = request.payload?.search?.trim() || ''
    const data = await fetchJsonFromBackend(request, `/v1/organisations`)

    let organisations = (Array.isArray(data) ? data : []).map(
      ({
        id,
        orgId,
        companyDetails: { name, registrationNumber },
        status,
        submittedToRegulator
      }) => ({
        id,
        orgId,
        name,
        registrationNumber,
        status,
        regulator: submittedToRegulator
      })
    )

    // Filter organisations by search term if provided
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      organisations = organisations.filter((org) =>
        org.name.toLowerCase().includes(searchLower)
      )
    }

    const pageTitle = request.route.settings.app.pageTitle

    return h.view('routes/organisations/index', {
      pageTitle,
      heading: pageTitle,
      searchTerm,
      organisations
    })
  }
}
