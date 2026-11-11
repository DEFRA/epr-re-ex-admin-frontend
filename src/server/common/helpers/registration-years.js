import {
  activeAccreditationStatus,
  regAccStatus,
  yearKind
} from '#server/common/constants/registration.js'

/**
 * @import { ActiveAccreditationStatus } from '#server/common/constants/registration.js'
 * @import { AccreditationStatus, RegAccStatusByDate, RegistrationView } from './fetch-organisation-view.js'
 */

/**
 * @typedef {{
 *   year: string,
 *   kind: typeof yearKind.accredited,
 *   accreditation: { accreditationNumber: string, status: ActiveAccreditationStatus }
 * }} AccreditedYear
 *
 * @typedef {{
 *   year: string,
 *   kind: typeof yearKind.registeredOnly,
 *   accreditation: null
 * }} RegisteredOnlyYear
 *
 * @typedef {AccreditedYear | RegisteredOnlyYear} YearDetails
 */

/** @type {readonly AccreditationStatus[]} */
const ACTIVE_ACCREDITATION_STATUSES = Object.values(activeAccreditationStatus)

/**
 * @param {AccreditationStatus} status
 * @returns {status is ActiveAccreditationStatus}
 */
const isActive = (status) => ACTIVE_ACCREDITATION_STATUSES.includes(status)

/**
 * @param {RegAccStatusByDate[string]} statusByDate
 * @returns {boolean}
 */
const hasRegisteredDay = (statusByDate) =>
  Object.values(statusByDate).some(
    ({ status }) => status !== regAccStatus.cancelled
  )

/**
 * The registration's details for `year`, or `null` when it was neither
 * registered nor accredited that year.
 * @param {RegistrationView} registration
 * @param {string} year
 * @returns {YearDetails | null}
 */
export const yearDetails = (registration, year) => {
  if (!Object.hasOwn(registration.regAccStatusByDate, year)) {
    return null
  }

  const accreditation = registration.accreditations[year]

  if (accreditation && isActive(accreditation.status.current)) {
    return {
      year,
      kind: yearKind.accredited,
      accreditation: {
        accreditationNumber: accreditation.accreditationNumber,
        status: accreditation.status.current
      }
    }
  }

  return hasRegisteredDay(registration.regAccStatusByDate[year])
    ? { year, kind: yearKind.registeredOnly, accreditation: null }
    : null
}

/**
 * One entry per registered or accredited year the backend serves, newest
 * first.
 * @param {RegistrationView} registration
 * @returns {YearDetails[]}
 */
export const registrationYears = (registration) =>
  Object.keys(registration.regAccStatusByDate)
    .map((year) => yearDetails(registration, year))
    .filter((details) => details !== null)
    .sort((one, other) => other.year.localeCompare(one.year))
