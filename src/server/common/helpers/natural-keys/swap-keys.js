/**
 * @import { StoredAccreditation, StoredOrganisation } from './find-organisation.js'
 *
 * @typedef {{ organisationId: string, registrationId?: string, accreditationId?: string }} RecordIds
 * @typedef {{ organisationNumber: string, registrationNumber?: string, year?: string }} NaturalKeys
 * @typedef {{ organisationNumber: string, registrationNumber: string }} RegistrationKeys
 * @typedef {RegistrationKeys & { year: string }} AccreditationKeys
 */

/**
 * @param {StoredOrganisation} organisation
 * @param {string} registrationNumber
 */
const isUniqueNumber = (organisation, registrationNumber) =>
  organisation.registrations.filter(
    (held) => held.registrationNumber === registrationNumber
  ).length === 1

/**
 * The year a numbered accreditation is for, or `null` before it has one.
 * @param {StoredAccreditation | undefined} accreditation
 * @returns {string | null}
 */
const accreditationYear = (accreditation) =>
  accreditation?.accreditationNumber && accreditation.validFrom
    ? String(new Date(accreditation.validFrom).getUTCFullYear())
    : null

/**
 * @overload
 * @param {StoredOrganisation} organisation
 * @param {{ organisationId: string, registrationId: string, accreditationId: string }} ids
 * @returns {AccreditationKeys | null}
 */
/**
 * @overload
 * @param {StoredOrganisation} organisation
 * @param {{ organisationId: string, registrationId: string }} ids
 * @returns {RegistrationKeys | null}
 */
/**
 * @overload
 * @param {StoredOrganisation} organisation
 * @param {RecordIds} ids
 * @returns {NaturalKeys | null}
 */
/**
 * The natural keys of the records the ids name, or `null` when one has none.
 * @param {StoredOrganisation} organisation
 * @param {RecordIds} ids
 * @returns {NaturalKeys | null}
 */
export function toNaturalKeys(
  organisation,
  { registrationId, accreditationId }
) {
  const organisationNumber = String(organisation.orgId)

  if (registrationId === undefined) {
    return { organisationNumber }
  }

  const registration = organisation.registrations.find(
    ({ id }) => id === registrationId
  )

  if (
    !registration?.registrationNumber ||
    !isUniqueNumber(organisation, registration.registrationNumber)
  ) {
    return null
  }

  const registrationNumber = registration.registrationNumber

  if (accreditationId === undefined) {
    return { organisationNumber, registrationNumber }
  }

  const year =
    registration.accreditationId === accreditationId
      ? accreditationYear(
          organisation.accreditations.find(({ id }) => id === accreditationId)
        )
      : null

  return year ? { organisationNumber, registrationNumber, year } : null
}
