import { formatPeriod } from '#server/common/helpers/format-reporting-period.js'

const SUBMITTED_STATUS = 'submitted'

const REQUIRES_RESUBMISSION_STATUS = 'requires_resubmission'

const periodKey = (period) => `${period.year}-${period.period}`

/**
 * Decorates each calendar reporting period with the two conditions the backend
 * refuses an unsubmit under, so no page offers an action that can only fail:
 * the submission is superseded by a later submitted one (PAE-1657), or the
 * period is flagged for resubmission (PAE-1775).
 *
 * Together these match the backend's absolute-latest rule
 * (isLatestSubmissionOf in reports/application/resubmission-service.js), which
 * counts submissions of any status: a draft above a submitted report can only
 * exist once that report was flagged for resubmission, so the flag covers the
 * case supersession alone would miss.
 *
 * ADR-0038 keeps the calendar payload free of both fields, so they are derived
 * here - the flagged report and its requires_resubmission item are separate
 * calendar items, hence the per-period set.
 * @param {Array<Record<string, any>>} reportingPeriods
 * @param {string} cadence
 * @returns {Array<Record<string, any> & {
 *   formattedPeriod: string,
 *   isFlaggedForResubmission: boolean,
 *   isSuperseded: boolean
 * }>}
 */
export const toReportingPeriods = (reportingPeriods, cadence) => {
  const periodsRequiringResubmission = new Set(
    reportingPeriods
      .filter((period) => period.periodStatus === REQUIRES_RESUBMISSION_STATUS)
      .map(periodKey)
  )
  const latestSubmittedSubmission = new Map()
  for (const period of reportingPeriods) {
    if (period.report?.status !== SUBMITTED_STATUS) {
      continue
    }
    const key = periodKey(period)
    latestSubmittedSubmission.set(
      key,
      Math.max(latestSubmittedSubmission.get(key) ?? 0, period.submissionNumber)
    )
  }
  return reportingPeriods.map((period) => ({
    ...period,
    formattedPeriod: formatPeriod(period.period, cadence),
    isSuperseded:
      period.report?.status === SUBMITTED_STATUS &&
      period.submissionNumber <
        latestSubmittedSubmission.get(periodKey(period)),
    isFlaggedForResubmission: periodsRequiringResubmission.has(
      periodKey(period)
    )
  }))
}
