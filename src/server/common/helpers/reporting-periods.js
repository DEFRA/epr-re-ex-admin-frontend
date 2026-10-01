import { formatPeriod } from '#server/common/helpers/format-reporting-period.js'
import {
  periodStatus,
  reportStatus
} from '#server/common/constants/report-status.js'

const periodKey = (period) => `${period.year}-${period.period}`

/**
 * Flags the two conditions the backend refuses an unsubmit under. ADR-0038
 * keeps both off the calendar payload, so they are derived here.
 *
 * The pair only equals the backend's absolute-latest rule
 * (isLatestSubmissionOf) because a draft can sit above a submitted report only
 * once that report was flagged - enforced by assertResubmissionAllowed and
 * pinned by epr-backend reports/routes/post.test.js ("rejects submission 2 ...
 * when submission 1 is submitted but not flagged").
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
      .filter(
        (period) => period.periodStatus === periodStatus.requiresResubmission
      )
      .map(periodKey)
  )
  const latestSubmittedSubmission = new Map()
  for (const period of reportingPeriods) {
    if (period.report?.status !== reportStatus.submitted) {
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
      period.report?.status === reportStatus.submitted &&
      period.submissionNumber <
        latestSubmittedSubmission.get(periodKey(period)),
    isFlaggedForResubmission: periodsRequiringResubmission.has(
      periodKey(period)
    )
  }))
}
