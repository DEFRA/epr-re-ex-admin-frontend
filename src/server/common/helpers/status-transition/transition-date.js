import { dateInputToIsoDate } from '#server/common/helpers/date-input.js'

/**
 * Parses and validates one GDS date-input from a confirm-page POST. Shared
 * between accreditation-status-transition and registration-status-transition,
 * whose grant confirm pages each collect a valid-from and a valid-to date
 * alongside a transition-specific identifier field.
 * @param {Record<string, string | undefined>} payload
 * @param {string} namePrefix - Date-input name prefix, e.g. 'validFrom'
 * @param {string} errorText - Shown when the parts are not a real calendar date
 * @returns {{
 *   day: string,
 *   month: string,
 *   year: string,
 *   isoDate: string | null,
 *   error?: string
 * }}
 */
export const parseTransitionDate = (payload, namePrefix, errorText) => {
  const day = (payload[`${namePrefix}-day`] ?? '').trim()
  const month = (payload[`${namePrefix}-month`] ?? '').trim()
  const year = (payload[`${namePrefix}-year`] ?? '').trim()
  const isoDate = dateInputToIsoDate(day, month, year)

  return {
    day,
    month,
    year,
    isoDate,
    error: isoDate ? undefined : errorText
  }
}
