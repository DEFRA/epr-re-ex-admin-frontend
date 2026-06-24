import { isNil } from './is-nil.js'

const significantDigits = 15

/**
 * Coerces a numeric CSV cell to a genuine number so it serialises unquoted.
 * Blank, nil or non-numeric values become an empty string (an empty cell).
 * Floating-point representation noise from upstream arithmetic is stripped so
 * the cell reads cleanly (e.g. 6913.459999999999 becomes 6913.46).
 *
 * @param {unknown} value
 * @returns {number | string}
 */
export function toCsvNumber(value) {
  if (isNil(value) || value === '') {
    return ''
  }

  const number = Number(value)

  if (Number.isNaN(number)) {
    return ''
  }

  return Number(number.toPrecision(significantDigits))
}
