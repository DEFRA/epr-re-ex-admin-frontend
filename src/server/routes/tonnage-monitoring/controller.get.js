import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { formatMaterialName, formatTonnage } from './formatters.js'
import { uniqueMonthNames } from '#server/routes/tonnage-monitoring/helper.js'

export const tonnageMonitoringGetController = {
  async handler(request, h) {
    const errorMessage = request.yar.get('error')
    await request.yar.clear('error')

    const data = await fetchJsonFromBackend(request, '/v1/tonnage-monitoring')

    const years = new Set(data.materials.map((item) => item.year))
    const hasMultipleYears = years.size > 1
    const monthNames = uniqueMonthNames(data)

    const materials = data.materials.map((item) => {
      const monthTonnageMap = new Map(
        item.months.map((m) => [m.month, m.tonnage])
      )

      return {
        material: formatMaterialName(item.material),
        type: item.type,
        ...(hasMultipleYears && { year: item.year }),
        ...Object.fromEntries(
          monthNames.map((monthName) => {
            return [monthName, formatTonnage(monthTonnageMap.get(monthName))]
          })
        )
      }
    })

    return h.view('routes/tonnage-monitoring/index', {
      pageTitle: request.route.settings.app.pageTitle,
      generatedAt: data.generatedAt,
      materials,
      monthNames,
      hasMultipleYears,
      total: formatTonnage(data.total),
      error: errorMessage
    })
  }
}
