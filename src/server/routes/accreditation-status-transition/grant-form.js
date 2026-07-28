import { parseAppliesFromDate } from '#server/common/helpers/status-transition/applies-from-date.js'

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
  const {
    day,
    month,
    year,
    appliesFrom,
    error: appliesFromError
  } = parseAppliesFromDate(payload)
  const accreditationNumber = (payload.accreditationNumber ?? '').trim()

  /** @type {{ appliesFrom?: string, accreditationNumber?: string }} */
  const errors = {}
  if (appliesFromError) {
    errors.appliesFrom = appliesFromError
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
