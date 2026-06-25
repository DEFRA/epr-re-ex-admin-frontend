import { isNil } from './is-nil.js'

/**
 * Rounds a numeric CSV cell to the export's reporting precision and returns a
 * genuine number so it serialises unquoted. Blank, nil or non-numeric values
 * become an empty string (an empty cell).
 *
 * @param {unknown} value
 * @param {number} decimals
 * @returns {number | string}
 */
export function roundForCsv(value, decimals) {
  if (isNil(value) || value === '') {
    return ''
  }

  const number = Number(value)

  if (Number.isNaN(number)) {
    return ''
  }

  return Number(number.toFixed(decimals))
}
