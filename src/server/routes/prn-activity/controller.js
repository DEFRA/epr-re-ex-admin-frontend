import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { formatDate } from '#config/nunjucks/filters/format-date.js'

const dateFormat = "d MMMM yyyy 'at' h:mmaaa"

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

export const prnActivityController = {
  async handler(request, h) {
    const errorMessage = request.yar.get('error')
    await request.yar.clear('error')

    const data = await fetchJsonFromBackend(
      request,
      '/v1/admin/packaging-recycling-notes?statuses=awaiting_authorisation,awaiting_acceptance,accepted,awaiting_cancellation,cancelled,deleted'
    )

    const prns = mapPrns(data)

    return h.view('routes/prn-activity/index', {
      pageTitle: request.route.settings.app.pageTitle,
      prns,
      error: errorMessage
    })
  }
}
