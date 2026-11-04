/**
 * Mirrors REG_ACC_STATUS in epr-backend
 * (organisation-read-model/domain/model.js) - the strings must match exactly,
 * because they are compared against the values the backend serves.
 */
export const regAccStatus = Object.freeze({
  registeredOnly: 'registeredOnly',
  accredited: 'accredited',
  cancelled: 'cancelled'
})

/**
 * @typedef {typeof regAccStatus[keyof typeof regAccStatus]} RegAccStatus
 */

/**
 * The backend's accreditation statuses that count as holding an accreditation.
 */
export const accreditationStatus = Object.freeze({
  approved: 'approved',
  suspended: 'suspended'
})

/**
 * Which of a registration's year pages a year uses.
 */
export const yearKind = Object.freeze({
  accredited: 'accredited',
  registeredOnly: 'registered-only'
})

/**
 * @typedef {typeof yearKind[keyof typeof yearKind]} YearKind
 */
