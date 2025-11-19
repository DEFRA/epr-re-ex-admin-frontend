import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

export const organisationsSearchController = {
  async handler(request, h) {
    const searchTerm = request.query.search || ''
    let organisations = []

    if (searchTerm) {
      try {
        // TODO: Update this endpoint URL when the backend endpoint is finalized
        // For now, using a placeholder endpoint structure
        const data = await fetchJsonFromBackend(
          request,
          `/v1/organisations/search?name=${encodeURIComponent(searchTerm)}`
        )

        organisations = (Array.isArray(data) ? data : []).map(
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
      } catch (error) {
        // If the API call fails, we'll just show no results
        request.logger.error(
          `Failed to search organisations: ${error.message}`
        )
        organisations = []
      }
    }

    return h.view('routes/organisations/search/index', {
      pageTitle: 'Search organisations',
      heading: 'Search organisations',
      searchTerm,
      organisations
    })
  }
}
