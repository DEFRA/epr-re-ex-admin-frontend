/**
 * @typedef {object} RegistrationStatusTransition
 * @property {string} fromStatus - Status the registration must currently hold
 * @property {string} toStatus - Status posted to the backend status-history endpoint
 * @property {string} pageTitle
 * @property {string} heading
 * @property {string} warningText - Confirm-page warning copy
 * @property {string} buttonText
 * @property {string} buttonClasses
 * @property {string} errorMessage - Flash fallback when the backend gives no message
 * @property {string} logMessage
 * @property {boolean} [hasGrantFields] - Confirm page collects appliesFrom + registrationNumber
 */

/**
 * Registration status transitions the admin UI can action, keyed by the URL
 * action segment. Each entry drives a confirm page and a POST of
 * `{ fromStatus, toStatus, ...params }` to the backend status-history
 * endpoint.
 * @type {Record<string, RegistrationStatusTransition>}
 */
export const REGISTRATION_STATUS_TRANSITIONS = {
  approve: {
    fromStatus: 'created',
    toStatus: 'approved',
    pageTitle: 'Approve registration',
    heading: 'Approve registration',
    warningText:
      'This action must only be taken following the required legal process for approval and following instruction from an industry regulator. Approving a registration registers the operator for this site and material — they must submit the registered-only summary log and report quarterly. It does not permit PRN/PERN issuing (an accreditation is required for that).',
    buttonText: 'Approve now',
    buttonClasses: '',
    errorMessage:
      'There was a problem approving the registration. Please try again.',
    logMessage: 'Approve registration failed',
    hasGrantFields: true
  }
}
