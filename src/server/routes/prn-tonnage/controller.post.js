import { writeToString } from '@fast-csv/format'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { formatDate } from '#config/nunjucks/filters/format-date.js'
import { roundForCsv } from '#server/common/helpers/round-for-csv.js'
import {
  formatMaterialName,
  formatTonnageBand,
  formatRegistrationType
} from './formatters.js'

const dateFormat = "d MMMM yyyy 'at' h:mmaaa"
const tonnageDecimals = 0

async function generateCsv(data) {
  const rows = [
    ['PRN tonnage'],
    [],
    [
      'Tonnage of PRNs per accreditation, broken down by current PRN status. ' +
        'Includes awaiting authorisation, awaiting acceptance, awaiting cancellation, accepted and cancelled.'
    ],
    [
      'Waste balance is the waste an accreditation holds after the PRNs it has issued. ' +
        'Available waste balance also deducts PRNs awaiting authorisation.'
    ],
    [],
    [`Data generated at: ${formatDate(data.generatedAt, dateFormat)}`],
    [],
    [
      'Organisation Name',
      'Organisation ID',
      'Registration Number',
      'Registration Type',
      'Accreditation Number',
      'Material',
      'Tonnage Band',
      'Waste balance',
      'Available waste balance',
      'Awaiting authorisation',
      'Awaiting acceptance',
      'Awaiting cancellation',
      'Accepted',
      'Cancelled'
    ]
  ]

  for (const row of data.rows) {
    rows.push([
      row.organisationName,
      row.orgId,
      row.registrationNumber,
      formatRegistrationType(row.registrationType),
      row.accreditationNumber,
      formatMaterialName(row.material),
      formatTonnageBand(row.tonnageBand),
      roundForCsv(row.wasteBalance, tonnageDecimals),
      roundForCsv(row.availableWasteBalance, tonnageDecimals),
      roundForCsv(row.awaitingAuthorisationTonnage, tonnageDecimals),
      roundForCsv(row.awaitingAcceptanceTonnage, tonnageDecimals),
      roundForCsv(row.awaitingCancellationTonnage, tonnageDecimals),
      roundForCsv(row.acceptedTonnage, tonnageDecimals),
      roundForCsv(row.cancelledTonnage, tonnageDecimals)
    ])
  }

  return writeToString(rows, { headers: false })
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

      return h.redirect('/prn-tonnage/results')
    }
  }
}
