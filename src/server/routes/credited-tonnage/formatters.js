import { format, parseISO } from 'date-fns'
import { formatMaterialName } from '#server/common/helpers/format-material-name.js'

const numberFormatter = new Intl.NumberFormat('en-GB', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

/**
 * Turn a `YYYY-MM` month key into its display form, e.g. `January 2026`.
 * @param {string} month
 * @returns {string}
 */
export function formatMonth(month) {
  return format(parseISO(`${month}-01`), 'MMMM yyyy')
}

/**
 * @param {number} value
 * @returns {string}
 */
export function formatNumber(value) {
  return numberFormatter.format(value)
}

/**
 * @param {string} processingType
 * @returns {string}
 */
export function formatProcessingType(processingType) {
  return processingType.charAt(0).toUpperCase() + processingType.slice(1)
}

/**
 * @param {import('./types.js').CreditedTonnageApiRow} row
 * @returns {import('./types.js').CreditedTonnageRow}
 */
export function mapCreditedTonnageRow(row) {
  return {
    month: formatMonth(row.month),
    organisationId: row.organisation.reference,
    accreditationNumber: row.accreditation.accreditationNumber,
    material: formatMaterialName(row.accreditation.material),
    type: formatProcessingType(row.accreditation.processingType),
    totalCredited: formatNumber(row.tonnage.totalCredited),
    eligibleForWasteBalance: formatNumber(row.tonnage.eligibleForWasteBalance),
    deductibleFromCredited: formatNumber(row.tonnage.deductibleFromCredited)
  }
}
