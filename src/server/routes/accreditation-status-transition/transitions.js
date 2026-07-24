/**
 * @typedef {object} AccreditationStatusTransition
 * @property {string} fromStatus - Status the accreditation must currently hold
 * @property {string} toStatus - Status posted to the backend status-history endpoint
 * @property {string} pageTitle
 * @property {string} heading
 * @property {string} warningText - Confirm-page warning copy
 * @property {string} buttonText
 * @property {string} buttonClasses
 * @property {string} errorMessage - Flash fallback when the backend gives no message
 * @property {string} logMessage
 * @property {boolean} [hasGrantFields] - Confirm page collects appliesFrom + accreditationNumber
 */

/**
 * Accreditation status transitions the admin UI can action, keyed by the URL
 * action segment. Each entry drives a confirm page and a POST of
 * `{ fromStatus, toStatus, ...params }` to the backend status-history
 * endpoint.
 * @type {Record<string, AccreditationStatusTransition>}
 */
export const ACCREDITATION_STATUS_TRANSITIONS = {
  approve: {
    fromStatus: 'created',
    toStatus: 'approved',
    pageTitle: 'Approve accreditation',
    heading: 'Approve accreditation',
    warningText:
      'This action must only be taken following the required legal process for approval and following instruction from an industry regulator. Approving an operator will grant them permission to issue PRNs and declared tonnages will count towards their waste balance',
    buttonText: 'Approve now',
    buttonClasses: '',
    errorMessage:
      'There was a problem approving the accreditation. Please try again.',
    logMessage: 'Approve accreditation failed',
    hasGrantFields: true
  },
  suspend: {
    fromStatus: 'approved',
    toStatus: 'suspended',
    pageTitle: 'Suspend accreditation',
    heading: 'Suspend accreditation',
    warningText:
      'This action must only be taken following the required legal process for suspension and following instruction from an industry regulator. Suspending an operator will remove their ability to issue PRNs and all declared tonnages submitted during the suspended period will not count towards their waste balance',
    buttonText: 'Suspend now',
    buttonClasses: 'govuk-button--warning',
    errorMessage:
      'There was a problem suspending the accreditation. Please try again.',
    logMessage: 'Suspend accreditation failed'
  },
  reapprove: {
    fromStatus: 'suspended',
    toStatus: 'approved',
    pageTitle: 'Reapprove accreditation',
    heading: 'Reapprove accreditation',
    warningText:
      'This action must only be taken following the required legal process for lifting a suspension and following instruction from an industry regulator. Lifting a suspension for an operator will reinstate their ability to issue PRNs and declared tonnages newly submitted will then count towards their waste balance. Tonnages during the suspended period will not count towards their waste balance',
    buttonText: 'Reapprove now',
    buttonClasses: '',
    errorMessage:
      'There was a problem reapproving the accreditation. Please try again.',
    logMessage: 'Reapprove accreditation failed'
  }
}
