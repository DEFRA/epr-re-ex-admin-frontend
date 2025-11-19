import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

export const organisationsBreadcrumb = {
  text: 'Organisations',
  href: '/organisations'
}

export const organisationsController = {
  async handler(request, h) {
    const data = await fetchJsonFromBackend(request, `/v1/organisations`)

    const organisations = (Array.isArray(data) ? data : []).map(
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

    return h.view('routes/organisations/index', {
      pageTitle: 'Organisations',
      heading: 'Organisations',
      organisations
    })
  }
}
