/**
 * @import { OrganisationOverview } from '#server/common/helpers/fetch-organisation-overview.js'
 *
 * @typedef {{ organisationId: string, registrationId?: string, accreditationId?: string }} RecordIds
 * @typedef {{ organisationNumber: string, registrationNumber?: string, year?: string }} NaturalKeys
 */

/**
 * @param {OrganisationOverview} overview
 * @param {string} registrationNumber
 */
const registrationsNumbered = (overview, registrationNumber) =>
  overview.registrations.filter(
    (registration) => registration.registrationNumber === registrationNumber
  )

/**
 * The year a numbered accreditation is for, or `null` before it has one.
 * @param {OrganisationOverview['registrations'][number]['accreditation']} accreditation
 * @returns {string | null}
 */
const accreditationYear = (accreditation) =>
  accreditation?.accreditationNumber && accreditation.year
    ? String(accreditation.year)
    : null

/**
 * @param {OrganisationOverview} overview
 * @param {RecordIds} ids
 * @returns {NaturalKeys | null}
 */
export const toNaturalKeys = (
  overview,
  { registrationId, accreditationId }
) => {
  const { organisationNumber } = overview

  if (registrationId === undefined) {
    return { organisationNumber }
  }

  const registration = overview.registrations.find(
    ({ id }) => id === registrationId
  )
  const registrationNumber = registration?.registrationNumber

  if (
    !registrationNumber ||
    registrationsNumbered(overview, registrationNumber).length !== 1
  ) {
    return null
  }

  if (accreditationId === undefined) {
    return { organisationNumber, registrationNumber }
  }

  const year =
    registration.accreditation?.id === accreditationId
      ? accreditationYear(registration.accreditation)
      : null

  return year ? { organisationNumber, registrationNumber, year } : null
}

/**
 * @param {OrganisationOverview} overview
 * @param {NaturalKeys} keys
 * @returns {RecordIds | null}
 */
export const toIds = (overview, { registrationNumber, year }) => {
  const organisationId = overview.id

  if (registrationNumber === undefined) {
    return { organisationId }
  }

  const matches = registrationsNumbered(overview, registrationNumber)

  if (matches.length !== 1) {
    return null
  }

  const [{ id: registrationId, accreditation }] = matches

  if (year === undefined) {
    return { organisationId, registrationId }
  }

  if (!accreditation || accreditationYear(accreditation) !== year) {
    return null
  }

  return { organisationId, registrationId, accreditationId: accreditation.id }
}
