import { writeToString } from '@fast-csv/format'
import { formatDate } from '#config/nunjucks/filters/format-date.js'
import { isNil } from '#server/common/helpers/is-nil.js'
import { sanitizeFormulaInjection } from '#server/common/helpers/sanitize-formula-injection.js'

/** @import { ResponseToolkit } from '@hapi/hapi' */

/**
 * One overseas reprocessing site as the backend's admin overseas sites routes
 * return it. A field the source does not hold may be absent.
 * @typedef {{
 *   orgId?: number | string | null,
 *   registrationNumber?: string | null,
 *   accreditationNumber?: string | null,
 *   orsId?: string | null,
 *   packagingWasteCategory?: string | null,
 *   destinationCountry?: string | null,
 *   overseasReprocessorName?: string | null,
 *   addressLine1?: string | null,
 *   addressLine2?: string | null,
 *   cityOrTown?: string | null,
 *   stateProvinceOrRegion?: string | null,
 *   postcode?: string | null,
 *   coordinates?: string | null,
 *   validFrom?: string | null
 * }} OverseasSiteRow
 */

/** @typedef {string | number | boolean} CsvValue */

const dateFormat = 'd MMMM yyyy'
const utf8Bom = '\uFEFF'

export const overseasSiteCsvHeaders = [
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

/**
 * @param {CsvValue | null | undefined} value
 * @returns {CsvValue}
 */
export function toCsvValue(value) {
  if (isNil(value) || value === '') {
    return ''
  }

  return sanitizeFormulaInjection(value)
}

/** @param {string | null | undefined} value */
function toValidFromCsvValue(value) {
  if (isNil(value) || value === '') {
    return ''
  }

  try {
    return formatDate(value, dateFormat)
  } catch {
    return ''
  }
}

/**
 * @param {OverseasSiteRow} row
 * @returns {CsvValue[]}
 */
export function overseasSiteCsvValues(row) {
  return [
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
  ]
}

/**
 * Excel reads a CSV as UTF-8 only when it starts with a byte order mark.
 * @param {CsvValue[][]} rows
 */
export async function toCsv(rows) {
  return `${utf8Bom}${await writeToString(rows, { headers: false })}`
}

/**
 * @param {ResponseToolkit} h
 * @param {string} csv
 * @param {string} filename
 */
export function csvAttachment(h, csv, filename) {
  return h
    .response(csv)
    .header('Content-Type', 'text/csv; charset=utf-8')
    .header('Content-Disposition', `attachment; filename="${filename}"`)
}
