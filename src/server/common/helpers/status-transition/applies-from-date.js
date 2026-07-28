/**
 * Builds a YYYY-MM-DD date from GDS date-input parts, or null when the parts
 * do not form a real calendar date.
 * @param {string} day
 * @param {string} month
 * @param {string} year
 * @returns {string | null}
 */
const toIsoDate = (day, month, year) => {
  if (
    !/^\d{1,2}$/.test(day) ||
    !/^\d{1,2}$/.test(month) ||
    !/^\d{4}$/.test(year)
  ) {
    return null
  }

  const iso = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  const date = new Date(`${iso}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime()) || !date.toISOString().startsWith(iso)) {
    return null
  }

  return iso
}

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
  const appliesFrom = toIsoDate(day, month, year)

  return {
    day,
    month,
    year,
    appliesFrom,
    error: appliesFrom ? undefined : 'Enter a valid applies from date'
  }
}
