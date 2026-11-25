import { writeToString } from '@fast-csv/format'
import { formatDate } from '#config/nunjucks/filters/format-date.js'
import { isNil } from '#server/common/helpers/is-nil.js'
import { sanitizeFormulaInjection } from '#server/common/helpers/sanitize-formula-injection.js'

const dateFormat = 'd MMMM yyyy'
const utf8Bom = '﻿'

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

export function toCsvValue(value) {
  if (isNil(value) || value === '') {
    return ''
  }

  return sanitizeFormulaInjection(value)
}

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

export function backendRows(data) {
  if (Array.isArray(data)) {
    return data
  }

  return Array.isArray(data?.rows) ? data.rows : []
}

/**
 * Excel reads a CSV as UTF-8 only when it starts with a byte order mark.
 * @param {unknown[][]} rows
 */
export async function toCsv(rows) {
  return `${utf8Bom}${await writeToString(rows, { headers: false })}`
}

export function csvAttachment(h, csv, filename) {
  return h
    .response(csv)
    .header('Content-Type', 'text/csv; charset=utf-8')
    .header('Content-Disposition', `attachment; filename="${filename}"`)
}
