import { parseAppliesFromDate } from '#server/common/helpers/status-transition/applies-from-date.js'

/**
 * Parses and validates the grant fields (applies from date parts and
 * registration number) from a confirm-page POST.
 * @param {Record<string, string | undefined>} payload
 * @returns {{
 *   values: { day: string, month: string, year: string, registrationNumber: string },
 *   errors: { appliesFrom?: string, registrationNumber?: string } | null,
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
  const registrationNumber = (payload.registrationNumber ?? '').trim()

  /** @type {{ appliesFrom?: string, registrationNumber?: string }} */
  const errors = {}
  if (appliesFromError) {
    errors.appliesFrom = appliesFromError
  }
  if (!registrationNumber) {
    errors.registrationNumber = 'Enter a registration number'
  }

  return {
    values: { day, month, year, registrationNumber },
    errors: Object.keys(errors).length > 0 ? errors : null,
    appliesFrom
  }
}
