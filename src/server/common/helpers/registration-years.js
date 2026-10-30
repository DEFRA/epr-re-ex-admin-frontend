/**
 * @import { RegistrationView } from '#server/common/helpers/fetch-organisation-view.js'
 */

/**
 * @typedef {{ year: string, accreditationNumber: string, status: string }} YearAccreditation
 */

/**
 * @param {string} date - YYYY-MM-DD or an ISO timestamp
 * @returns {number}
 */
const yearOf = (date) => Number(date.slice(0, 4))

const HELD_ACCREDITATION_STATUSES = new Set(['approved', 'suspended'])

/**
 * Today's UTC date as YYYY-MM-DD.
 * @returns {string}
 */
export const utcToday = () => new Date().toISOString().slice(0, 10)

/**
 * The years from the registration's `validFrom` to this year, or to the year
 * it was cancelled, oldest first.
 * @param {RegistrationView} registration
 * @param {string} today - YYYY-MM-DD
 * @returns {number[]}
 */
export const registeredYears = ({ validFrom, status }, today) => {
  const end =
    status.current === 'cancelled'
      ? (status.timeline.at(-1)?.at ?? today)
      : today
  const from = yearOf(validFrom)
  return Array.from({ length: yearOf(end) - from + 1 }, (_, i) => from + i)
}

/**
 * Whether the registration's accreditation for `year` is approved or
 * suspended.
 * @param {RegistrationView} registration
 * @param {number | string} year
 * @returns {boolean}
 */
export const isAccredited = ({ accreditations }, year) =>
  Object.hasOwn(accreditations, year) &&
  HELD_ACCREDITATION_STATUSES.has(accreditations[year].status.current)

/**
 * The registration's accreditation for `year`, or `null` when it is not
 * approved or suspended.
 * @param {RegistrationView} registration
 * @param {string} year
 * @returns {YearAccreditation | null}
 */
export const accreditationFor = (registration, year) => {
  if (!isAccredited(registration, year)) {
    return null
  }

  const { accreditationNumber, status } = registration.accreditations[year]

  return { year, accreditationNumber, status: status.current }
}

/**
 * @typedef {'accredited' | 'registered-only'} YearKind
 */

/**
 * @param {RegistrationView} registration
 * @param {number | string} year - one of the registration's registered or
 *   accredited years
 * @returns {YearKind}
 */
const kindOf = (registration, year) =>
  isAccredited(registration, year) ? 'accredited' : 'registered-only'

/**
 * Whether `year` is one of the registration's accredited or registered-only
 * years, or `null` when it is neither.
 * @param {RegistrationView} registration
 * @param {string} year
 * @param {string} today - YYYY-MM-DD
 * @returns {YearKind | null}
 */
export const yearKind = (registration, year, today) =>
  isAccredited(registration, year) ||
  registeredYears(registration, today).includes(Number(year))
    ? kindOf(registration, year)
    : null

/**
 * One row per registered or accredited year, newest first. An accredited year
 * after the registered years, such as next year's accreditation approved
 * early, gets a row too.
 * @param {RegistrationView} registration
 * @param {string} today - YYYY-MM-DD
 * @returns {{
 *   year: string,
 *   kind: YearKind,
 *   accreditation: YearAccreditation | null
 * }[]}
 */
export const registrationYears = (registration, today) => {
  const years = new Set([
    ...registeredYears(registration, today),
    ...Object.keys(registration.accreditations)
      .map(Number)
      .filter((year) => isAccredited(registration, year))
  ])

  return [...years]
    .sort((a, b) => b - a)
    .map((year) => ({
      year: String(year),
      kind: kindOf(registration, year),
      accreditation: accreditationFor(registration, String(year))
    }))
}
