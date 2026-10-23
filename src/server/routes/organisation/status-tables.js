import { accreditationStatusActions } from '#server/routes/accreditation-status-transition/transitions.js'
import { registrationStatusActions } from '#server/routes/registration-status-transition/transitions.js'

/**
 * @typedef {{ id: string, registrationNumber?: string, status: string, accreditationId?: string }} StoredRegistration
 * @typedef {{ id: string, accreditationNumber?: string, status: string }} StoredAccreditation
 * @typedef {{ href: string, text: string, visuallyHiddenText: string }} StatusAction
 * @typedef {{ id: string, number: string, linkedNumber: string, status: string, actions: StatusAction[] }} StatusRow
 */

/**
 * Every registration and accreditation in the organisation, with the status
 * changes each can take. A row's linked number is the number of the record it
 * is linked to. An accreditation no registration links to has no actions, as a
 * status change goes through its registration.
 * @param {{
 *   id: string,
 *   registrations: StoredRegistration[],
 *   accreditations: StoredAccreditation[]
 * }} organisation
 * @returns {{ registrationRows: StatusRow[], accreditationRows: StatusRow[] }}
 */
export const toStatusTables = ({ id, registrations, accreditations }) => {
  const registrationUrl = (registration) =>
    `/organisations/${id}/registrations/${registration.id}`

  const registrationRows = registrations.map((registration) => {
    const accreditation = accreditations.find(
      ({ id: accreditationId }) =>
        accreditationId === registration.accreditationId
    )

    return {
      id: registration.id,
      number: registration.registrationNumber ?? '',
      linkedNumber: accreditation?.accreditationNumber ?? '',
      status: registration.status,
      actions: registrationStatusActions(
        registration.status,
        registrationUrl(registration)
      )
    }
  })

  const accreditationRows = accreditations.map((accreditation) => {
    const registration = registrations.find(
      ({ accreditationId }) => accreditationId === accreditation.id
    )

    return {
      id: accreditation.id,
      number: accreditation.accreditationNumber ?? '',
      linkedNumber: registration?.registrationNumber ?? '',
      status: accreditation.status,
      actions: registration
        ? accreditationStatusActions(
            accreditation.status,
            `${registrationUrl(registration)}/accreditations/${accreditation.id}`,
            registration.status
          )
        : []
    }
  })

  return { registrationRows, accreditationRows }
}
