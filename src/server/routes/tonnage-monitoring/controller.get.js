import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { formatTonnage, materialRowHeading } from './formatters.js'
import { buildMaterialRowData } from '#server/routes/tonnage-monitoring/helper.js'
import {
  defaultYear,
  tonnageMonitoringUrl,
  tonnageMonitoringYears
} from './year.js'

export const tonnageMonitoringGetController = {
  async handler(request, h) {
    const { years, year } = await tonnageMonitoringYears(request)
    if (year === undefined) {
      return h.redirect(tonnageMonitoringUrl(defaultYear(years)))
    }

    const errorMessage = request.yar.get('error')
    await request.yar.clear('error')

    const data = await fetchJsonFromBackend(
      request,
      `/v1/tonnage-monitoring?year=${year}`
    )

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
      year,
      yearItems: years.map((item) => ({
        value: item,
        text: item,
        selected: item === year
      })),
      materials,
      monthNames,
      hasMultipleYears,
      total: formatTonnage(data.total),
      error: errorMessage
    })
  }
}
