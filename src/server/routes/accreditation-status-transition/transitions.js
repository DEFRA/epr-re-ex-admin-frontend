/**
 * @typedef {object} AccreditationStatusTransition
 * @property {string} fromStatus - Status the accreditation must currently hold
 * @property {string} toStatus - Status posted to the backend status-history endpoint
 * @property {string} linkText - Overview action label, e.g. "Suspend"
 * @property {string} pageTitle
 * @property {string} heading
 * @property {string} warningText - Confirm-page warning copy
 * @property {string} buttonText
 * @property {string} buttonClasses
 * @property {string} errorMessage - Flash fallback when the backend gives no message
 * @property {string} logMessage
 * @property {boolean} [hasGrantFields] - Confirm page collects appliesFrom + accreditationNumber
 */

const WARNING_BUTTON_CLASS = 'govuk-button--warning'

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
    linkText: 'Approve',
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
    linkText: 'Suspend',
    pageTitle: 'Suspend accreditation',
    heading: 'Suspend accreditation',
    warningText:
      'This action must only be taken following the required legal process for suspension and following instruction from an industry regulator. Suspending an operator will remove their ability to issue PRNs and all declared tonnages submitted during the suspended period will not count towards their waste balance',
    buttonText: 'Suspend now',
    buttonClasses: WARNING_BUTTON_CLASS,
    errorMessage:
      'There was a problem suspending the accreditation. Please try again.',
    logMessage: 'Suspend accreditation failed'
  },
  reapprove: {
    fromStatus: 'suspended',
    toStatus: 'approved',
    linkText: 'Reapprove',
    pageTitle: 'Reapprove accreditation',
    heading: 'Reapprove accreditation',
    warningText:
      'This action must only be taken following the required legal process for lifting a suspension and following instruction from an industry regulator. Lifting a suspension for an operator will reinstate their ability to issue PRNs and declared tonnages newly submitted will then count towards their waste balance. Tonnages during the suspended period will not count towards their waste balance',
    buttonText: 'Reapprove now',
    buttonClasses: '',
    errorMessage:
      'There was a problem reapproving the accreditation. Please try again.',
    logMessage: 'Reapprove accreditation failed'
  },
  // Cancellation is only reachable from suspended — there is deliberately no
  // approved -> cancelled action (suspend first, PAE-1624 / ADR 0042).
  cancel: {
    fromStatus: 'suspended',
    toStatus: 'cancelled',
    linkText: 'Cancel',
    pageTitle: 'Cancel accreditation',
    heading: 'Cancel accreditation',
    warningText:
      'This action must only be taken following the required legal process for cancellation and following instruction from an industry regulator. Cancelling an accreditation is permanent: the operator will no longer be able to issue PRNs and tonnages declared after the cancellation will not count towards their waste balance',
    buttonText: 'Cancel accreditation now',
    buttonClasses: WARNING_BUTTON_CLASS,
    errorMessage:
      'There was a problem cancelling the accreditation. Please try again.',
    logMessage: 'Cancel accreditation failed'
  },
  // Reinstatement after a cancellation is overturned on appeal (PAE-1785),
  // effective on the day it is actioned — not retrospective.
  reinstate: {
    fromStatus: 'cancelled',
    toStatus: 'approved',
    linkText: 'Reinstate',
    pageTitle: 'Reinstate accreditation',
    heading: 'Reinstate accreditation',
    warningText:
      'This action must only be taken where a cancellation has been overturned by the required legal process (for example a successful appeal through the courts) and following instruction from an industry regulator. Reinstating the operator will restore their ability to issue PRNs and newly declared tonnages will count towards their waste balance from the date of reinstatement. Tonnages dated during the cancelled period will not count towards their waste balance',
    buttonText: 'Reinstate now',
    buttonClasses: '',
    errorMessage:
      'There was a problem reinstating the accreditation. Please try again.',
    logMessage: 'Reinstate accreditation failed'
  },
  // Refusing a non-compliant application (PAE-1618): the operator stays
  // registered-only — no number or validity dates are involved.
  reject: {
    fromStatus: 'created',
    toStatus: 'rejected',
    linkText: 'Reject',
    pageTitle: 'Reject accreditation',
    heading: 'Reject accreditation',
    warningText:
      'This action must only be taken following the required legal process for refusing an accreditation application and following instruction from an industry regulator. Rejecting an accreditation means the operator remains registered-only: they cannot issue PRNs and declared tonnages will not count towards a waste balance',
    buttonText: 'Reject now',
    buttonClasses: WARNING_BUTTON_CLASS,
    errorMessage:
      'There was a problem rejecting the accreditation. Please try again.',
    logMessage: 'Reject accreditation failed'
  },
  // Reopening a rejected application for rework (PAE-1623).
  reopen: {
    fromStatus: 'rejected',
    toStatus: 'created',
    linkText: 'Reopen',
    pageTitle: 'Reopen accreditation',
    heading: 'Reopen accreditation',
    warningText:
      'This action must only be taken following instruction from an industry regulator. Reopening a rejected accreditation returns the application to created so it can be reworked and reconsidered. The operator remains registered-only and cannot issue PRNs unless the accreditation is subsequently approved',
    buttonText: 'Reopen now',
    buttonClasses: '',
    errorMessage:
      'There was a problem reopening the accreditation. Please try again.',
    logMessage: 'Reopen accreditation failed'
  }
}

/**
 * Summary-list action items for every transition available from the given
 * accreditation status. Single source of truth for which actions the
 * registration overview offers per status.
 * @param {string} status - Current accreditation status
 * @param {string} baseUrl - Accreditation URL prefix, `.../accreditations/{id}`
 * @returns {Array<{href: string, text: string, visuallyHiddenText: string}>}
 */
export const accreditationStatusActions = (status, baseUrl) =>
  Object.entries(ACCREDITATION_STATUS_TRANSITIONS)
    .filter(([, transition]) => transition.fromStatus === status)
    .map(([action, transition]) => ({
      href: `${baseUrl}/${action}/confirm`,
      text: transition.linkText,
      visuallyHiddenText: 'accreditation'
    }))
