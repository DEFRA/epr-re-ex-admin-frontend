/**
 * Stored report lifecycle statuses. Mirrors REPORT_STATUS in epr-backend
 * (reports/domain/report-status.js) - the strings must match exactly, because
 * they are compared against the values the backend puts on a report.
 */
export const reportStatus = Object.freeze({
  inProgress: 'in_progress',
  readyToSubmit: 'ready_to_submit',
  submitted: 'submitted'
})

/**
 * @typedef {typeof reportStatus[keyof typeof reportStatus]} ReportStatus
 */

/**
 * Derived status of a reporting period: the report statuses, plus the
 * date-derived due/overdue states and requires_resubmission. Mirrors
 * PERIOD_STATUS in epr-backend (reports/domain/period-status.js), which is
 * likewise a superset of the report statuses.
 */
export const periodStatus = Object.freeze({
  ...reportStatus,
  due: 'due',
  overdue: 'overdue',
  requiresResubmission: 'requires_resubmission'
})

/**
 * @typedef {typeof periodStatus[keyof typeof periodStatus]} PeriodStatus
 */
