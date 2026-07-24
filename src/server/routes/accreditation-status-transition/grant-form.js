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
 * Parses and validates the grant fields (applies from date parts and
 * accreditation number) from a confirm-page POST.
 * @param {Record<string, string | undefined>} payload
 * @returns {{
 *   values: { day: string, month: string, year: string, accreditationNumber: string },
 *   errors: { appliesFrom?: string, accreditationNumber?: string } | null,
 *   appliesFrom: string | null
 * }}
 */
export const parseGrantForm = (payload) => {
  const day = (payload['appliesFrom-day'] ?? '').trim()
  const month = (payload['appliesFrom-month'] ?? '').trim()
  const year = (payload['appliesFrom-year'] ?? '').trim()
  const accreditationNumber = (payload.accreditationNumber ?? '').trim()

  const appliesFrom = toIsoDate(day, month, year)

  /** @type {{ appliesFrom?: string, accreditationNumber?: string }} */
  const errors = {}
  if (!appliesFrom) {
    errors.appliesFrom = 'Enter a valid applies from date'
  }
  if (!accreditationNumber) {
    errors.accreditationNumber = 'Enter an accreditation number'
  }

  return {
    values: { day, month, year, accreditationNumber },
    errors: Object.keys(errors).length > 0 ? errors : null,
    appliesFrom
  }
}
