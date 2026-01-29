import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

function formatMaterialName(material) {
  return material.charAt(0).toUpperCase() + material.slice(1).toLowerCase()
}

function formatTonnage(tonnage) {
  return tonnage.toFixed(2)
}

export const tonnageMonitoringGetController = {
  async handler(request, h) {
    const data = await fetchJsonFromBackend(request, '/v1/tonnage-monitoring')

    const materials = data.materials.map((item) => ({
      material: formatMaterialName(item.material),
      totalTonnage: formatTonnage(item.totalTonnage)
    }))

    return h.view('routes/tonnage-monitoring/index', {
      pageTitle: request.route.settings.app.pageTitle,
      generatedAt: data.generatedAt,
      materials,
      total: formatTonnage(data.total)
    })
  }
}
