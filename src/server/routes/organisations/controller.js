import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

const getLatestStatus = (statusHistory) => {
  // Handle missing or empty status history gracefully
  if (!Array.isArray(statusHistory) || statusHistory.length === 0) {
    return {}
  }

  const orderedStatus = statusHistory.toSorted(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
  )

  return orderedStatus[0]
}

export const organisationsController = {
  async handler(_request, h) {
    const { data, errorView } = await fetchJsonFromBackend(`/organisations`)

    if (errorView) {
      return h.view(errorView)
    }

    const organisations = (Array.isArray(data) ? data : []).map(
      ({
        orgId,
        statusHistory,
        companyDetails: { name, registrationNumber }
      }) => ({
        orgId,
        name,
        registrationNumber,
        status: getLatestStatus(statusHistory)?.status
      })
    )

    return h.view('routes/organisations/index', {
      pageTitle: 'Organisations',
      heading: 'Organisations',
      organisations,
      breadcrumbs: [
        {
          text: 'Home',
          href: '/'
        },
        {
          text: 'Organisations'
        }
      ]
    })
  }
}
