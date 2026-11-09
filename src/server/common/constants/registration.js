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
 * The accreditation statuses that count as holding an accreditation. Mirrors
 * ACTIVE_ACCREDITATION_STATUSES in epr-backend (domain/organisations/model.js).
 */
export const activeAccreditationStatus = Object.freeze({
  approved: 'approved',
  suspended: 'suspended'
})

/**
 * @typedef {typeof activeAccreditationStatus[keyof typeof activeAccreditationStatus]} ActiveAccreditationStatus
 */

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
