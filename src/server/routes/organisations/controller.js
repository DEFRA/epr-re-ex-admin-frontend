import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

export const organisationsBreadcrumb = {
  text: 'Organisations',
  href: '/organisations'
}

export const organisationsController = {
  async handler(_request, h) {
    const { data, errorView } = await fetchJsonFromBackend(`/v1/organisations`)

    if (errorView) {
      return h.view(errorView)
    }

    const organisations = (Array.isArray(data) ? data : []).map(
      ({
        id,
        orgId,
        companyDetails: { name, registrationNumber },
        status
      }) => ({
        id,
        orgId,
        name,
        registrationNumber,
        status
      })
    )

    return h.view('routes/organisations/index', {
      pageTitle: 'Organisations',
      heading: 'Organisations',
      organisations
    })
  }
}
