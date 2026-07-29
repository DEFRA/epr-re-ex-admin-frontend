/**
 * Path params carried by every report-unsubmit route, all strings because they
 * come straight off the URL. Mirrors PeriodWithSubmissionPathParams in
 * epr-backend (reports/routes/shared.js), which validates the same shape.
 * @typedef {{
 *   cadence: string,
 *   organisationId: string,
 *   period: string,
 *   registrationId: string,
 *   submissionNumber: string,
 *   year: string
 * }} ReportSubmissionParams
 */

export {} // NOSONAR: javascript:S7787 - Required to make this file a module for JSDoc @import
