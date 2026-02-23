import { writeToString } from '@fast-csv/format'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { formatDate } from '#config/nunjucks/filters/format-date.js'
import {
  formatMaterialName,
  formatTonnageBand,
  formatTonnage
} from './formatters.js'

const dateFormat = "d MMMM yyyy 'at' h:mmaaa"

async function generateCsv(data) {
  const rows = [
    ['PRN tonnage'],
    [],
    [
      'Tonnage of PRNs per accreditation, broken down by current PRN status. ' +
        'Created includes draft and awaiting authorisation. ' +
        'Issued includes awaiting acceptance. ' +
        'Cancelled includes awaiting cancellation and cancelled.'
    ],
    [],
    [`Data generated at: ${formatDate(data.generatedAt, dateFormat)}`],
    [],
    [
      'Organisation Name',
      'Organisation ID',
      'Accreditation Number',
      'Material',
      'Tonnage Band',
      'Created',
      'Issued',
      'Cancelled'
    ]
  ]

  for (const row of data.rows) {
    rows.push([
      row.organisationName,
      row.organisationId,
      row.accreditationNumber,
      formatMaterialName(row.material),
      formatTonnageBand(row.tonnageBand),
      formatTonnage(row.createdTonnage),
      formatTonnage(row.issuedTonnage),
      formatTonnage(row.cancelledTonnage)
    ])
  }

  return writeToString(rows, { headers: false, quoteColumns: true })
}

export const prnTonnagePostController = {
  async handler(request, h) {
    try {
      const data = await fetchJsonFromBackend(request, '/v1/prn-tonnage')
      const csv = await generateCsv(data)
      const filename = 'prn-tonnage.csv'

      return h
        .response(csv)
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', `attachment; filename="${filename}"`)
    } catch (error) {
      const errorMessage =
        error.output?.payload?.message ||
        'There was a problem downloading the PRN tonnage data. Please try again.'

      request.yar.set('error', errorMessage)

      return h.redirect('/prn-tonnage')
    }
  }
}
