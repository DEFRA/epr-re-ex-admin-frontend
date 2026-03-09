import { writeToString } from '@fast-csv/format'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { formatDate } from '#config/nunjucks/filters/format-date.js'
import { formatMaterialName, formatTonnage } from './formatters.js'
import { uniqueMonthNames } from '#server/routes/tonnage-monitoring/helper.js'

const dateFormat = "d MMMM yyyy 'at' h:mmaaa"

async function generateCsv(data) {
  const years = [...new Set(data.materials.map((item) => item.year))]
  const hasMultipleYears = years.length > 1

  const monthNames = uniqueMonthNames(data)

  const rows = [
    ['Tonnage by material'],
    [],
    [
      'Cumulative total of incoming tonnage, excluding any PRN or sent-on deductions. Includes all uploaded records regardless of accreditation dates.'
    ],
    [],
    [`Data generated at: ${formatDate(data.generatedAt, dateFormat)}`],
    [],
    [`Total: ${formatTonnage(data.total)}`],
    []
  ]

  const headerRow = ['Material', 'Type']
  if (hasMultipleYears) {
    headerRow.push('Year')
  }
  headerRow.push(...monthNames)
  rows.push(headerRow)

  for (const item of data.materials) {
    const row = [formatMaterialName(item.material), item.type]
    if (hasMultipleYears) {
      row.push(item.year)
    }

    const monthTonnageMap = new Map(
      item.months.map((m) => [m.month, m.tonnage])
    )
    for (const monthName of monthNames) {
      row.push(formatTonnage(monthTonnageMap.get(monthName)))
    }
    rows.push(row)
  }

  return writeToString(rows, { headers: false, quoteColumns: true })
}

export const tonnageMonitoringPostController = {
  async handler(request, h) {
    try {
      const data = await fetchJsonFromBackend(request, '/v1/tonnage-monitoring')
      const csv = await generateCsv(data)
      const filename = 'tonnage-monitoring.csv'

      return h
        .response(csv)
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', `attachment; filename="${filename}"`)
    } catch (error) {
      const errorMessage =
        error.output?.payload?.message ||
        'There was a problem downloading the tonnage data. Please try again.'

      request.yar.set('error', errorMessage)

      return h.redirect('/tonnage-monitoring')
    }
  }
}
