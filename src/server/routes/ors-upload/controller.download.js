import { writeToString } from '@fast-csv/format'
import { formatDate } from '#config/nunjucks/filters/format-date.js'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { sanitizeFormulaInjection } from '#server/common/helpers/sanitize-formula-injection.js'

const dateFormat = 'd MMMM yyyy'

function toCsvValue(value) {
  if (value === null || value === undefined || value === '') {
    return ''
  }

  return sanitizeFormulaInjection(value)
}

function toValidFromCsvValue(value) {
  if (value === null || value === undefined || value === '') {
    return ''
  }

  try {
    return formatDate(value, dateFormat)
  } catch {
    return ''
  }
}

function getRows(data) {
  if (Array.isArray(data)) {
    return data
  }

  return Array.isArray(data?.rows) ? data.rows : []
}

async function generateCsv(data) {
  const rows = [
    [
      'Org ID',
      'Registration Number',
      'Accreditation Number',
      'ORS ID',
      'Packaging waste category',
      'Destination country',
      'Overseas reprocessor name',
      'Address line 1',
      'Address line 2',
      'City or town',
      'State, province or region',
      'Postcode or similar',
      'Coordinates',
      'Valid from'
    ]
  ]

  for (const row of getRows(data)) {
    rows.push([
      toCsvValue(row.orgId),
      toCsvValue(row.registrationNumber),
      toCsvValue(row.accreditationNumber),
      toCsvValue(row.orsId),
      toCsvValue(row.packagingWasteCategory),
      toCsvValue(row.destinationCountry),
      toCsvValue(row.overseasReprocessorName),
      toCsvValue(row.addressLine1),
      toCsvValue(row.addressLine2),
      toCsvValue(row.cityOrTown),
      toCsvValue(row.stateProvinceOrRegion),
      toCsvValue(row.postcode),
      toCsvValue(row.coordinates),
      toValidFromCsvValue(row.validFrom)
    ])
  }

  return writeToString(rows, { headers: false, quoteColumns: true })
}

export const orsDownloadController = {
  async handler(request, h) {
    try {
      const data = await fetchJsonFromBackend(
        request,
        '/v1/admin/overseas-sites?all=true'
      )
      const csv = await generateCsv(data)

      return h
        .response(csv)
        .header('Content-Type', 'text/csv')
        .header(
          'Content-Disposition',
          'attachment; filename="overseas-reprocessing-sites.csv"'
        )
    } catch (error) {
      const errorMessage =
        error.output?.payload?.message ||
        'There was a problem downloading the overseas reprocessing site data. Please try again.'

      request.yar.set('error', errorMessage)

      return h.redirect('/overseas-sites')
    }
  }
}
