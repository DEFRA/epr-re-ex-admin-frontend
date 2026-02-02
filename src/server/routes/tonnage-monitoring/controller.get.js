import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { formatMaterialName, formatTonnage } from './formatters.js'

export const tonnageMonitoringGetController = {
  async handler(request, h) {
    const errorMessage = request.yar.get('error')
    await request.yar.clear('error')

    const data = await fetchJsonFromBackend(request, '/v1/tonnage-monitoring')

    const materials = data.materials.map((item) => ({
      material: formatMaterialName(item.material),
      totalTonnage: formatTonnage(item.totalTonnage)
    }))

    return h.view('routes/tonnage-monitoring/index', {
      pageTitle: request.route.settings.app.pageTitle,
      generatedAt: data.generatedAt,
      materials,
      total: formatTonnage(data.total),
      error: errorMessage
    })
  }
}
