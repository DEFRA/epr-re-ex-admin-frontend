import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { formatTonnage, materialRowHeading } from './formatters.js'
import { buildMaterialRowData } from '#server/routes/tonnage-monitoring/helper.js'

export const tonnageMonitoringGetController = {
  async handler(request, h) {
    const errorMessage = request.yar.get('error')
    await request.yar.clear('error')

    const data = await fetchJsonFromBackend(request, '/v1/tonnage-monitoring')

    const { rows, monthNames, hasMultipleYears } = buildMaterialRowData(data)

    const materials = rows.map((row) => ({
      material: materialRowHeading(row),
      type: row.type,
      ...(hasMultipleYears && { year: row.year }),
      ...Object.fromEntries(
        Object.entries(row.monthValues).map(([month, value]) => [
          month,
          formatTonnage(value)
        ])
      ),
      total: formatTonnage(row.total)
    }))

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
