import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { formatDate } from '#config/nunjucks/filters/format-date.js'

const dateFormat = "d MMMM yyyy 'at' h:mmaaa"
const statuses =
  'awaiting_authorisation,awaiting_acceptance,accepted,awaiting_cancellation,cancelled,deleted'

function getDisplayName(org) {
  if (!org) return ''
  return org.tradingName || org.name || ''
}

function mapPrns(data) {
  const items = data?.items || []
  return items.map((prn) => ({
    prnNumber: prn.prnNumber || '',
    status: prn.status,
    issuedTo: getDisplayName(prn.issuedToOrganisation),
    tonnage: prn.tonnage,
    material: prn.material || '',
    processToBeUsed: prn.processToBeUsed || '',
    isDecemberWaste: prn.isDecemberWaste ? 'Yes' : 'No',
    notes: prn.notes || '',
    issuedAt: prn.issuedAt ? formatDate(prn.issuedAt, dateFormat) : '',
    issuedByName: prn.issuedBy?.name || '',
    issuedByPosition: prn.issuedBy?.position || '',
    accreditationYear: prn.accreditationYear ?? '',
    organisationName: prn.organisationName || '',
    wasteProcessingType: prn.wasteProcessingType || ''
  }))
}

export function buildPrnApiUrl(cursor) {
  let url = `/v1/admin/packaging-recycling-notes?statuses=${statuses}`
  if (cursor) {
    url += `&cursor=${encodeURIComponent(cursor)}`
  }
  return url
}

export const prnActivityController = {
  async handler(request, h) {
    const errorMessage = request.yar.get('error')
    await request.yar.clear('error')

    const cursor = request.query.cursor || null
    const url = buildPrnApiUrl(cursor)
    const data = await fetchJsonFromBackend(request, url)

    const prns = mapPrns(data)

    const pagination = {}
    if (data?.hasMore && data?.nextCursor) {
      pagination.next = {
        href: `/prn-activity?cursor=${encodeURIComponent(data.nextCursor)}`
      }
    }
    if (cursor) {
      pagination.previous = {
        href: '/prn-activity'
      }
    }

    return h.view('routes/prn-activity/index', {
      pageTitle: request.route.settings.app.pageTitle,
      prns,
      pagination,
      error: errorMessage
    })
  }
}
