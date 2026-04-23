import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { transformSystemLog } from './transform-system-log.js'

export const systemLogPostController = {
  async handler(request, h) {
    const referenceNumber = request.payload?.referenceNumber?.trim() || ''
    const email = request.payload?.email?.trim() || ''
    const subCategory = request.payload?.subCategory || ''

    const hasAnyFilter = referenceNumber || email

    if (!hasAnyFilter) {
      return h.view('routes/system-logs/index', {
        pageTitle: request.route.settings.app.pageTitle,
        systemLogs: [],
        searchTerms: { referenceNumber, email, subCategory },
        error: {
          text: 'Enter an organisation reference number or email address',
          href: '#referenceNumber'
        }
      })
    }

    const body = {}
    if (referenceNumber) {
      body.organisationId = referenceNumber
    }
    if (email) {
      body.email = email
    }
    if (subCategory) {
      body.subCategory = subCategory
    }

    const data = await fetchJsonFromBackend(request, '/v1/system-logs/search', {
      method: 'POST',
      body: JSON.stringify(body)
    })

    return h.view('routes/system-logs/index', {
      pageTitle: request.route.settings.app.pageTitle,
      systemLogs: data.systemLogs.map(transformSystemLog),
      searchTerms: { referenceNumber, email, subCategory },
      error: null
    })
  }
}
