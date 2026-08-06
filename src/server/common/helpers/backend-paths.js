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
 * straight off the URL. Mirrors PeriodWithSubmissionPathParams in epr-backend
 * (reports/routes/shared.js), which validates the same shape.
 * @typedef {{
 *   cadence: string,
 *   organisationId: string,
 *   period: string,
 *   registrationId: string,
 *   submissionNumber: string,
 *   year: string
 * }} PeriodSubmissionParams
 */

/**
 * @param {Pick<PeriodSubmissionParams, 'organisationId' | 'registrationId'>} params
 */
const registrationPath = ({ organisationId, registrationId }) =>
  `/v1/organisations/${organisationId}/registrations/${registrationId}`

/**
 * A single submission's stored report.
 * @param {PeriodSubmissionParams} params
 */
export const periodSubmissionPath = (params) => {
  const { year, cadence, period, submissionNumber } = params
  return `${registrationPath(params)}/reports/${year}/${cadence}/${period}/submissions/${submissionNumber}`
}

/**
 * The unsubmit action on a single submission.
 * @param {PeriodSubmissionParams} params
 */
export const periodSubmissionUnsubmitPath = (params) =>
  `${periodSubmissionPath(params)}/unsubmit`

/**
 * The reporting calendar, expanded so every submission of a period is listed
 * rather than collapsed to the current one - the view both the registration
 * overview and the unsubmit confirmation need to spot a superseded submission.
 * @param {Pick<PeriodSubmissionParams, 'organisationId' | 'registrationId'>} params
 */
export const reportsCalendarPath = (params) =>
  `${registrationPath(params)}/reports/calendar?expand=submissions`
