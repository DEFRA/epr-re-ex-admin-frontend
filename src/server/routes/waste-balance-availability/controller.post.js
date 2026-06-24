import { writeToString } from '@fast-csv/format'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { formatDate } from '#config/nunjucks/filters/format-date.js'
import { toCsvNumber } from '#server/common/helpers/to-csv-number.js'
import { formatMaterialName } from './formatters.js'

const dateFormat = "d MMMM yyyy 'at' h:mmaaa"

async function generateCsv(data) {
  /** @type {(string | number)[][]} */
  const rows = [
    ['Waste balance availability by material'],
    [],
    ['Available waste balance by material, after PRN and sent-on deductions.'],
    [],
    [`Data generated at: ${formatDate(data.generatedAt, dateFormat)}`],
    [],
    ['Material', 'Available amount']
  ]

  for (const item of data.materials) {
    rows.push([
      formatMaterialName(item.material),
      toCsvNumber(item.availableAmount)
    ])
  }

  rows.push(['Total', toCsvNumber(data.total)])

  return writeToString(rows, { headers: false })
}

export const wasteBalanceAvailabilityPostController = {
  async handler(request, h) {
    try {
      const data = await fetchJsonFromBackend(
        request,
        '/v1/waste-balance-availability'
      )
      const csv = await generateCsv(data)
      const filename = 'waste-balance-availability.csv'

      return h
        .response(csv)
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', `attachment; filename="${filename}"`)
    } catch (error) {
      const errorMessage =
        error.output?.payload?.message ||
        'There was a problem downloading the waste balance data. Please try again.'

      request.yar.set('error', errorMessage)

      return h.redirect('/waste-balance-availability')
    }
  }
}
