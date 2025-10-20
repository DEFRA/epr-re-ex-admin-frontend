import { config } from '#config/config.js'

const getLatestStatus = (statusHistory) => {
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

    const data = await response.json()

    const organisations = data.map(
      ({
        orgId,
        statusHistory,
        companyDetails: { name, registrationNumber }
      }) => ({
        orgId,
        name,
        registrationNumber,
        status: getLatestStatus(statusHistory).status
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
