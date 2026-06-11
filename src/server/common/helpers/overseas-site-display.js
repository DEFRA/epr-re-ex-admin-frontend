import { formatDate } from '#config/nunjucks/filters/format-date.js'
import { isNil } from '#server/common/helpers/is-nil.js'

const VALID_FROM_FORMAT = 'd MMMM yyyy'

/**
 * @param {string | null | undefined} value
 * @returns {string}
 */
export function toDisplayValue(value) {
  return isNil(value) || value === '' ? '-' : value
}

/**
 * A site is approved once it has a valid-from date; an unapproved or
 * unresolved site has none, which renders as a dash.
 *
 * @param {string | null | undefined} value
 * @returns {string}
 */
export function toValidFromDisplayValue(value) {
  if (isNil(value) || value === '') {
    return '-'
  }

  try {
    return formatDate(value, VALID_FROM_FORMAT)
  } catch {
    return '-'
  }
}
