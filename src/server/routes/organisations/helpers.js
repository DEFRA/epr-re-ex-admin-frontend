/**
 * An organisation as the backend lists it. Only numbered registrations and
 * accreditations are listed.
 * @typedef {{
 *   name: string,
 *   organisationNumber: string,
 *   registrations: Record<string, {
 *     accreditations: Record<string, { accreditationNumber: string }>
 *   }>,
 *   status: { current: string },
 *   submittedToRegulator: { code: string }
 * }} OrganisationListItem
 *
 * One line of the Reg/Acc Numbers column.
 * @typedef {{
 *   registrationNumber: string,
 *   accreditationNumber: string | null
 * }} RegAccPair
 */

/**
 * Builds the Reg/Acc Numbers lines for an organisation: one per registration
 * and accreditation year, oldest year first, or one with no accreditation
 * number for a registration that has none.
 *
 * @param {Pick<OrganisationListItem, 'registrations'>} organisation
 * @returns {RegAccPair[]}
 */
export const toRegAccPairs = ({ registrations }) =>
  Object.entries(registrations).flatMap(
    /** @returns {RegAccPair[]} */
    ([registrationNumber, { accreditations }]) => {
      const years = Object.keys(accreditations).sort((a, b) =>
        a.localeCompare(b)
      )

      return years.length === 0
        ? [{ registrationNumber, accreditationNumber: null }]
        : years.map((year) => ({
            registrationNumber,
            accreditationNumber: accreditations[year].accreditationNumber
          }))
    }
  )

/**
 * Projects a listed organisation onto the fields the organisations table
 * renders.
 *
 * @param {OrganisationListItem} organisation
 * @returns {{
 *   organisationNumber: string,
 *   name: string,
 *   regAccPairs: RegAccPair[],
 *   status: string,
 *   regulator: string
 * }}
 */
export const toSlimOrganisation = (organisation) => ({
  organisationNumber: organisation.organisationNumber,
  name: organisation.name,
  regAccPairs: toRegAccPairs(organisation),
  status: organisation.status.current,
  regulator: organisation.submittedToRegulator.code
})
