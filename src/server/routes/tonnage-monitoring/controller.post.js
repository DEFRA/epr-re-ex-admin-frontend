import { format, parseISO } from 'date-fns'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

function formatMaterialName(material) {
  return material.charAt(0).toUpperCase() + material.slice(1).toLowerCase()
}

function formatTonnage(tonnage) {
  return tonnage.toFixed(2)
}

function formatDate(dateString) {
  return format(parseISO(dateString), "d MMMM yyyy 'at' h:mmaaa")
}

function generateCsv(data) {
  const lines = [
    'Tonnage by material',
    '',
    '"Cumulative total of incoming tonnage, excluding any PRN or sent-on deductions. Includes all uploaded records regardless of accreditation dates."',
    '',
    `Data generated at: ${formatDate(data.generatedAt)}`,
    '',
    'Material,Tonnage'
  ]

  for (const item of data.materials) {
    lines.push(
      `${formatMaterialName(item.material)},${formatTonnage(item.totalTonnage)}`
    )
  }

  lines.push(`Total,${formatTonnage(data.total)}`)

  return lines.join('\n')
}

export const tonnageMonitoringPostController = {
  async handler(request, h) {
    try {
      const data = await fetchJsonFromBackend(request, '/v1/tonnage-monitoring')
      const csv = generateCsv(data)
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
