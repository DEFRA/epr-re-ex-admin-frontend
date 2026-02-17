import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { formatMaterialName, formatAmount } from './formatters.js'

export const wasteBalanceAvailabilityGetController = {
  async handler(request, h) {
    const errorMessage = request.yar.get('error')
    await request.yar.clear('error')

    const data = await fetchJsonFromBackend(
      request,
      '/v1/waste-balance-availability'
    )

    const materials = data.materials.map((item) => ({
      material: formatMaterialName(item.material),
      availableAmount: formatAmount(item.availableAmount)
    }))

    return h.view('routes/waste-balance-availability/index', {
      pageTitle: request.route.settings.app.pageTitle,
      generatedAt: data.generatedAt,
      materials,
      total: formatAmount(data.total),
      error: errorMessage
    })
  }
}
