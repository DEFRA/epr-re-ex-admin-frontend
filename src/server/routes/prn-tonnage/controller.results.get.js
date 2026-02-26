import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import {
  formatMaterialName,
  formatTonnageBand,
  formatTonnage
} from './formatters.js'

export const prnTonnageResultsGetController = {
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
      awaitingAuthorisationTonnage: formatTonnage(
        row.awaitingAuthorisationTonnage
      ),
      awaitingAcceptanceTonnage: formatTonnage(row.awaitingAcceptanceTonnage),
      awaitingCancellationTonnage: formatTonnage(
        row.awaitingCancellationTonnage
      ),
      acceptedTonnage: formatTonnage(row.acceptedTonnage),
      cancelledTonnage: formatTonnage(row.cancelledTonnage)
    }))

    return h.view('routes/prn-tonnage/results', {
      pageTitle: request.route.settings.app.pageTitle,
      generatedAt: data.generatedAt,
      rows,
      error: errorMessage
    })
  }
}
