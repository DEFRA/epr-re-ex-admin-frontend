import { config } from '#config/config.js'
import { handleBackendError } from '#server/common/helpers/handleBackendError.js'

const getLatestStatus = (statusHistory) => {
  // Handle missing or empty status history gracefully
  if (!Array.isArray(statusHistory) || statusHistory.length === 0) {
    return {}
  }

  const orderedStatus = statusHistory.sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
  )

  return orderedStatus[0]
}

/**
 * A GDS styled organisations page controller.
 * Provided as an example, remove or modify as required.
 */
export const organisationsController = {
  async handler(_request, h) {
    const eprBackendUrl = config.get('eprBackendUrl')

    const response = await fetch(`${eprBackendUrl}/organisations`)

    if (!response?.ok) {
      return handleBackendError(h, response)
    }

    const data = await response.json()

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
