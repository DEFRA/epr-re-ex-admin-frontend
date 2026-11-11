/** @import { AccreditationStatus } from '#server/common/helpers/fetch-organisation-view.js' */

/**
 * Mirrors STANDING in epr-backend
 * (organisation-read-model/domain/model.js) - the strings must match exactly,
 * because they are compared against the values the backend serves.
 */
export const standing = Object.freeze({
  registeredOnly: 'registeredOnly',
  accredited: 'accredited',
  cancelled: 'cancelled'
})

/**
 * @typedef {typeof standing[keyof typeof standing]} Standing
 */

/**
 * The accreditation statuses that count as holding an accreditation. Mirrors
 * ACTIVE_ACCREDITATION_STATUSES in epr-backend (domain/organisations/model.js).
 */
export const activeAccreditationStatus = Object.freeze(
  /** @satisfies {Record<string, AccreditationStatus>} */ ({
    approved: 'approved',
    suspended: 'suspended'
  })
)

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
