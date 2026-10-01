/**
 * An accreditation embedded on an organisation. Its number stays null until the
 * accreditation is approved.
 * @typedef {{ id: string, accreditationNumber?: string | null }} Accreditation
 *
 * A registration embedded on an organisation. Its number stays null until the
 * registration is approved, and `accreditationId` is absent until an
 * accreditation is applied for.
 * @typedef {{
 *   registrationNumber?: string | null,
 *   accreditationId?: string
 * }} Registration
 *
 * @typedef {{
 *   registrations?: Registration[],
 *   accreditations?: Accreditation[]
 * }} OrganisationRecords
 *
 * One line of the Reg/Acc Numbers column.
 * @typedef {{
 *   registrationNumber: string | null,
 *   accreditationNumber: string | null
 * }} RegAccPair
 */

/**
 * Builds the Reg/Acc Numbers lines for an organisation: one pair per
 * registration, in registration order, each carrying the number of the
 * accreditation it references, followed by one pair per orphan accreditation —
 * an accreditation that no registration references — in accreditation order.
 *
 * Orphans are found by `accreditationId` reference, not by number, so an
 * accreditation that is referenced but not yet approved appears only on its
 * registration's line.
 *
 * @param {OrganisationRecords} organisation
 * @returns {RegAccPair[]}
 */
export const toRegAccPairs = ({ registrations = [], accreditations = [] }) => {
  // Keyed loosely so an unset accreditationId simply misses
  /** @type {Map<string | undefined, Accreditation>} */
  const accreditationsById = new Map(
    accreditations.map((accreditation) => [accreditation.id, accreditation])
  )
  const referencedAccreditationIds = new Set(
    registrations.map(({ accreditationId }) => accreditationId)
  )

  const registrationPairs = registrations.map(
    ({ registrationNumber, accreditationId }) => ({
      registrationNumber: registrationNumber ?? null,
      accreditationNumber:
        accreditationsById.get(accreditationId)?.accreditationNumber ?? null
    })
  )

  const orphanPairs = accreditations
    .filter(({ id }) => !referencedAccreditationIds.has(id))
    .map(({ accreditationNumber }) => ({
      registrationNumber: null,
      accreditationNumber: accreditationNumber ?? null
    }))

  return [...registrationPairs, ...orphanPairs]
}

/**
 * Projects a backend organisation document onto the fields the organisations
 * table renders.
 *
 * @param {OrganisationRecords & {
 *   id: string,
 *   orgId: string,
 *   companyDetails: { name: string },
 *   status: string,
 *   submittedToRegulator: string
 * }} organisation
 * @returns {{
 *   id: string,
 *   orgId: string,
 *   name: string,
 *   regAccPairs: RegAccPair[],
 *   status: string,
 *   regulator: string
 * }}
 */
export const toSlimOrganisation = (organisation) => {
  const {
    id,
    orgId,
    companyDetails: { name },
    status,
    submittedToRegulator
  } = organisation

  return {
    id,
    orgId,
    name,
    regAccPairs: toRegAccPairs(organisation),
    status,
    regulator: submittedToRegulator
  }
}
