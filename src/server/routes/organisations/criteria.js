/**
 * The organisation search criteria. Every non-empty value narrows the results,
 * and they are ANDed together by the backend.
 *
 * @typedef {{
 *   search: string,
 *   organisationNumber: string,
 *   registrationNumber: string,
 *   accreditationNumber: string
 * }} SearchCriteria
 */

/**
 * The search fields in the order they appear on the form. Each name doubles as
 * the form field name and the backend query parameter.
 *
 * @type {Array<keyof SearchCriteria>}
 */
export const CRITERIA_KEYS = [
  'search',
  'organisationNumber',
  'registrationNumber',
  'accreditationNumber'
]

/**
 * Reads the four search criteria from a request's query string or payload,
 * trimming each so that whitespace-only input counts as unfilled.
 *
 * @param {Record<string, string | undefined>} source
 * @returns {SearchCriteria}
 */
export const toCriteria = (source) => ({
  search: (source.search ?? '').trim(),
  organisationNumber: (source.organisationNumber ?? '').trim(),
  registrationNumber: (source.registrationNumber ?? '').trim(),
  accreditationNumber: (source.accreditationNumber ?? '').trim()
})

/**
 * @param {Partial<SearchCriteria>} criteria
 * @returns {boolean} whether the user filled in at least one search field
 */
export const hasAnyCriterion = (criteria) =>
  CRITERIA_KEYS.some((key) => Boolean(criteria[key]))
