import {
  accreditationStatus,
  regAccStatus,
  yearKind
} from '#server/common/constants/registration.js'

/**
 * @import { YearKind } from '#server/common/constants/registration.js'
 * @import { RegAccStatusByDate, RegistrationView } from './fetch-organisation-view.js'
 */

/**
 * @typedef {{
 *   year: string,
 *   kind: YearKind,
 *   accreditation: { accreditationNumber: string, status: string } | null
 * }} YearDetails
 */

/** @type {Set<string | undefined>} */
const HELD_ACCREDITATION_STATUSES = new Set([
  accreditationStatus.approved,
  accreditationStatus.suspended
])

/**
 * @param {RegAccStatusByDate[string]} statusByDate
 * @param {string} today - YYYY-MM-DD
 * @returns {boolean}
 */
const hasRegisteredDay = (statusByDate, today) =>
  Object.entries(statusByDate).some(
    ([date, { status }]) =>
      status !== regAccStatus.cancelled && date.localeCompare(today) <= 0
  )

/**
 * The registration's details for `year`, or `null` when it was neither
 * registered nor accredited that year.
 * @param {RegistrationView} registration
 * @param {string} year
 * @param {string} today - YYYY-MM-DD
 * @returns {YearDetails | null}
 */
export const yearDetails = (registration, year, today) => {
  if (!Object.hasOwn(registration.regAccStatusByDate, year)) {
    return null
  }

  const accreditation = registration.accreditations[year]

  if (HELD_ACCREDITATION_STATUSES.has(accreditation?.status.current)) {
    return {
      year,
      kind: yearKind.accredited,
      accreditation: {
        accreditationNumber: accreditation.accreditationNumber,
        status: accreditation.status.current
      }
    }
  }

  return hasRegisteredDay(registration.regAccStatusByDate[year], today)
    ? { year, kind: yearKind.registeredOnly, accreditation: null }
    : null
}

/**
 * One entry per registered or accredited year, newest first.
 * @param {RegistrationView} registration
 * @param {string} today - YYYY-MM-DD
 * @returns {YearDetails[]}
 */
export const registrationYears = (registration, today) =>
  Object.keys(registration.regAccStatusByDate)
    .map((year) => yearDetails(registration, year, today))
    .filter((details) => details !== null)
    .sort((one, other) => other.year.localeCompare(one.year))
