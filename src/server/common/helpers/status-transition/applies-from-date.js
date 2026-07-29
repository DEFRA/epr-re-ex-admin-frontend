import { dateInputToIsoDate } from '#server/common/helpers/date-input.js'

/**
 * Parses and validates the "applies from" GDS date-input fields from a
 * confirm-page POST. Shared between accreditation-status-transition and
 * registration-status-transition, whose confirm pages both collect this date
 * alongside a transition-specific identifier field.
 * @param {Record<string, string | undefined>} payload
 * @returns {{
 *   day: string,
 *   month: string,
 *   year: string,
 *   appliesFrom: string | null,
 *   error?: string
 * }}
 */
export const parseAppliesFromDate = (payload) => {
  const day = (payload['appliesFrom-day'] ?? '').trim()
  const month = (payload['appliesFrom-month'] ?? '').trim()
  const year = (payload['appliesFrom-year'] ?? '').trim()
  const appliesFrom = dateInputToIsoDate(day, month, year)

  return {
    day,
    month,
    year,
    appliesFrom,
    error: appliesFrom ? undefined : 'Enter a valid applies from date'
  }
}
