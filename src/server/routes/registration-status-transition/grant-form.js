import { parseTransitionDate } from '#server/common/helpers/status-transition/transition-date.js'

/**
 * @typedef {object} DateInputValues
 * @property {string} day
 * @property {string} month
 * @property {string} year
 */

/**
 * @typedef {object} GrantFormValues
 * @property {DateInputValues} validFrom
 * @property {DateInputValues} validTo
 * @property {string} registrationNumber
 */

/**
 * Parses and validates the grant fields (valid from and valid to date parts,
 * and the registration number) from a confirm-page POST. Values are keyed per
 * field so both dates survive a re-render.
 * @param {Record<string, string | undefined>} payload
 * @returns {{
 *   values: GrantFormValues,
 *   errors: {
 *     validFrom?: string,
 *     validTo?: string,
 *     registrationNumber?: string
 *   } | null,
 *   validFrom: string | null,
 *   validTo: string | null
 * }}
 */
export const parseGrantForm = (payload) => {
  const from = parseTransitionDate(
    payload,
    'validFrom',
    'Enter the date the registration is valid from'
  )
  const to = parseTransitionDate(
    payload,
    'validTo',
    'Enter the date the registration is valid to'
  )
  const registrationNumber = (payload.registrationNumber ?? '').trim()

  /** @type {{ validFrom?: string, validTo?: string, registrationNumber?: string }} */
  const errors = {}
  if (from.error) {
    errors.validFrom = from.error
  }
  if (to.error) {
    errors.validTo = to.error
  }
  if (!registrationNumber) {
    errors.registrationNumber = 'Enter a registration number'
  }

  return {
    values: {
      validFrom: { day: from.day, month: from.month, year: from.year },
      validTo: { day: to.day, month: to.month, year: to.year },
      registrationNumber
    },
    errors: Object.keys(errors).length > 0 ? errors : null,
    validFrom: from.isoDate,
    validTo: to.isoDate
  }
}
