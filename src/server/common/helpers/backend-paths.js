/**
 * Paths on epr-backend that more than one admin route asks for. Keeping them
 * here means a backend route change is one edit rather than a grep, and the
 * route params map onto them without each controller restating the shape.
 *
 * One-off paths (organisation overview, summary logs, waste balances) stay at
 * their single call site until a second one turns up.
 */

/**
 * Path params identifying one report submission, all strings because they come
 * straight off the URL.
 * @typedef {{
 *   cadence: string,
 *   organisationNumber: string,
 *   period: string,
 *   registrationNumber: string,
 *   submissionNumber: string,
 *   year: string
 * }} PeriodSubmissionParams
 */

/**
 * Numbers have no guaranteed format, so each is encoded as one path segment.
 * @param {Pick<PeriodSubmissionParams, 'organisationNumber'>} params
 */
export const organisationPath = ({ organisationNumber }) =>
  `/organisations/${encodeURIComponent(organisationNumber)}`

/**
 * @param {Pick<PeriodSubmissionParams, 'organisationNumber' | 'registrationNumber'>} params
 */
export const registrationPath = (params) =>
  `${organisationPath(params)}/registrations/${encodeURIComponent(params.registrationNumber)}`

/**
 * @param {Pick<PeriodSubmissionParams, 'organisationNumber' | 'registrationNumber' | 'year'>} params
 */
export const accreditationPath = (params) =>
  `${registrationPath(params)}/accreditations/${encodeURIComponent(params.year)}`

/**
 * A single submission's report, addressed as the backend addresses it: an
 * accredited (monthly) report under the accreditation for its year, a
 * registered-only (quarterly) one under the registration. The admin page for
 * the submission has the same path.
 * @param {PeriodSubmissionParams} params
 */
export const periodSubmissionPath = (params) => {
  const [year, cadence, period, submissionNumber] = [
    params.year,
    params.cadence,
    params.period,
    params.submissionNumber
  ].map(encodeURIComponent)
  const reports =
    params.cadence === 'monthly'
      ? `${accreditationPath(params)}/reports/${cadence}`
      : `${registrationPath(params)}/reports/${year}/${cadence}`
  return `${reports}/${period}/submissions/${submissionNumber}`
}

/**
 * A single submission's report with all of it the backend holds, not just the
 * resource it serves the operator.
 * @param {PeriodSubmissionParams} params
 */
export const periodSubmissionDetailPath = (params) =>
  `${periodSubmissionPath(params)}?expand=detail`

/**
 * The unsubmit action on a single submission.
 * @param {PeriodSubmissionParams} params
 */
export const periodSubmissionUnsubmitPath = (params) =>
  `${periodSubmissionPath(params)}/unsubmit`

/**
 * The reporting calendar, expanded so every submission of a period is listed
 * rather than collapsed to the current one - the view the unsubmit
 * confirmation needs to spot a superseded submission.
 * @param {Pick<PeriodSubmissionParams, 'organisationNumber' | 'registrationNumber'>} params
 */
export const reportsCalendarPath = (params) =>
  `${registrationPath(params)}/reports/calendar?expand=submissions`

/**
 * The same calendar by database ids, for the registration overview, which
 * also shows registrations that have no number yet.
 * @param {{ organisationId: string, registrationId: string }} ids
 */
export const reportsCalendarPathByIds = ({ organisationId, registrationId }) =>
  `/v1/organisations/${organisationId}/registrations/${registrationId}/reports/calendar?expand=submissions`
