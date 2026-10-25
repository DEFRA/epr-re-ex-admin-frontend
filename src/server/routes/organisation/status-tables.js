import {
  ACCREDITATION_STATUS_TRANSITIONS,
  accreditationStatusActions
} from '#server/routes/accreditation-status-transition/transitions.js'
import { registrationStatusActions } from '#server/routes/registration-status-transition/transitions.js'

/**
 * @typedef {{ id: string, registrationNumber?: string, status: string, accreditationId?: string }} StoredRegistration
 * @typedef {{ id: string, accreditationNumber?: string, status: string }} StoredAccreditation
 * @typedef {{ href: string, text: string, visuallyHiddenText: string }} StatusAction
 * @typedef {{ id: string, number: string, linkedNumber: string, status: string, actions: StatusAction[], notes: string[] }} StatusRow
 */

export const NOT_LINKED = 'Not linked to a registration'
export const REGISTRATION_NOT_APPROVED = 'Linked registration not approved'

/**
 * Why an accreditation is offered fewer status changes than its status allows.
 * A status change goes through the registration it is linked to, and approving
 * needs that registration approved (PAE-1800).
 * @param {StoredAccreditation} accreditation
 * @param {StoredRegistration | undefined} registration
 * @returns {string[]}
 */
const accreditationNotes = (accreditation, registration) => {
  if (!registration) {
    return [NOT_LINKED]
  }

  const heldBack =
    registration.status !== 'approved' &&
    Object.values(ACCREDITATION_STATUS_TRANSITIONS).some(
      ({ fromStatus, requiresApprovedRegistration }) =>
        fromStatus === accreditation.status && requiresApprovedRegistration
    )

  return heldBack ? [REGISTRATION_NOT_APPROVED] : []
}

/**
 * A record's number, or its ID until it is numbered.
 * @param {StoredRegistration} registration
 * @returns {string}
 */
const registrationLabel = ({ registrationNumber, id }) =>
  registrationNumber ?? id

/**
 * @param {StoredAccreditation} accreditation
 * @returns {string}
 */
const accreditationLabel = ({ accreditationNumber, id }) =>
  accreditationNumber ?? id

/**
 * Every registration and accreditation in the organisation, with the status
 * changes each can take and why any are held back. A row's linked number
 * names the record it is linked to.
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
      linkedNumber: accreditation ? accreditationLabel(accreditation) : '',
      status: registration.status,
      actions: registrationStatusActions(
        registration.status,
        registrationUrl(registration),
        registrationLabel(registration)
      ),
      notes: []
    }
  })

  const accreditationRows = accreditations.map((accreditation) => {
    const registration = registrations.find(
      ({ accreditationId }) => accreditationId === accreditation.id
    )

    return {
      id: accreditation.id,
      number: accreditation.accreditationNumber ?? '',
      linkedNumber: registration ? registrationLabel(registration) : '',
      status: accreditation.status,
      actions: registration
        ? accreditationStatusActions(
            accreditation.status,
            `${registrationUrl(registration)}/accreditations/${accreditation.id}`,
            registration.status,
            accreditationLabel(accreditation)
          )
        : [],
      notes: accreditationNotes(accreditation, registration)
    }
  })

  return { registrationRows, accreditationRows }
}
