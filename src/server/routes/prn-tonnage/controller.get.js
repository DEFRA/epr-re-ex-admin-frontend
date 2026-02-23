import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import {
  formatMaterialName,
  formatTonnageBand,
  formatTonnage
} from './formatters.js'

export const prnTonnageGetController = {
  async handler(request, h) {
    const errorMessage = request.yar.get('error')
    await request.yar.clear('error')

    const data = await fetchJsonFromBackend(request, '/v1/prn-tonnage')

    const rows = data.rows.map((row) => ({
      organisationName: row.organisationName,
      organisationId: row.organisationId,
      accreditationNumber: row.accreditationNumber,
      material: formatMaterialName(row.material),
      tonnageBand: formatTonnageBand(row.tonnageBand),
      createdTonnage: formatTonnage(row.createdTonnage),
      issuedTonnage: formatTonnage(row.issuedTonnage),
      cancelledTonnage: formatTonnage(row.cancelledTonnage)
    }))

    return h.view('routes/prn-tonnage/index', {
      pageTitle: request.route.settings.app.pageTitle,
      generatedAt: data.generatedAt,
      rows,
      error: errorMessage
    })
  }
}
