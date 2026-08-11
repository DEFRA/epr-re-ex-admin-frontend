/** @import { Accreditation, Registration } from '#server/common/helpers/fetch-organisation-overview.js' */

const APPROVED_STATUS = 'approved'

/**
 * The registrations an unlinked accreditation may be assigned to.
 *
 * A registration qualifies when it is approved, describes the same waste
 * activity as the accreditation (material, processing type and site), carries a
 * reprocessing type, and does not already hold an accreditation of its own.
 * Filtering here is UX — the backend enforces the same rules — but it keeps the
 * admin from picking an option the backend would only reject.
 * @param {Registration[]} registrations
 * @param {Accreditation} accreditation
 * @returns {Registration[]}
 */
export const candidateRegistrations = (registrations, accreditation) =>
  registrations.filter(
    (registration) =>
      registration.status === APPROVED_STATUS &&
      !registration.accreditation &&
      Boolean(registration.reprocessingType) &&
      registration.material === accreditation.material &&
      registration.processingType === accreditation.processingType &&
      registration.site === accreditation.site
  )
