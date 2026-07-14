/**
 * Month helpers for the waste balance report.
 *
 * The report is Europe/London based throughout: "the previous month" and the
 * validation bounds are evaluated on the London calendar, and a month's
 * cutoff is midnight London time on the 1st of the following month. Near a
 * month boundary London and UTC can disagree on what the current month is,
 * so every helper that needs a clock takes `now` as a parameter.
 */

const LONDON_TIME_ZONE = 'Europe/London'
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/
const MILLISECONDS_PER_HOUR = 60 * 60 * 1000

/**
 * The earliest selectable report month — service start. There is no ledger
 * data before it.
 */
const EARLIEST_REPORT_MONTH = '2026-01'

/**
 * `YYYY-MM` of the given UTC month-start date.
 * @param {Date} monthStart
 */
const toMonthValue = (monthStart) => monthStart.toISOString().slice(0, 7)

/**
 * UTC month-start date for a `YYYY-MM` value. `Date.UTC` rolls months over,
 * so callers can pass an out-of-range month index to step across years.
 * @param {string} monthValue
 */
const toMonthStart = (monthValue) => {
  const [year, month] = monthValue.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, 1))
}

/**
 * The UTC month-start one month before the given one.
 * @param {Date} monthStart
 */
const monthBefore = (monthStart) =>
  new Date(
    Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() - 1, 1)
  )

/**
 * The London calendar month containing the instant, as `YYYY-MM`. The en-CA
 * locale formats dates ISO-style, so it yields the value directly.
 * @param {Date} instant
 */
const londonMonthValue = (instant) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: LONDON_TIME_ZONE,
    year: 'numeric',
    month: '2-digit'
  }).format(instant)

/**
 * The most recent complete month on the London calendar, as `YYYY-MM`.
 * @param {Date} now
 * @returns {string}
 */
const previousReportMonth = (now) =>
  toMonthValue(monthBefore(toMonthStart(londonMonthValue(now))))

/**
 * "June 2026"-style label for a `YYYY-MM` month value.
 * @param {string} monthValue
 */
const monthLabel = (monthValue) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    month: 'long',
    year: 'numeric'
  }).format(toMonthStart(monthValue))

/**
 * govukSelect items for every selectable report month: all complete months
 * from January 2026 to the previous month, newest first, with the previous
 * month selected as the default.
 * @param {Date} now
 * @returns {{ value: string, text: string, selected: boolean }[]}
 */
export const reportMonthItems = (now) => {
  const latest = previousReportMonth(now)
  const items = []

  for (
    let cursor = toMonthStart(latest);
    toMonthValue(cursor) >= EARLIEST_REPORT_MONTH;
    cursor = monthBefore(cursor)
  ) {
    const value = toMonthValue(cursor)
    items.push({ value, text: monthLabel(value), selected: value === latest })
  }

  return items
}

/**
 * Whether the value names a selectable report month: a string of well-formed
 * `YYYY-MM`, no earlier than January 2026 and no later than the previous
 * London month. Takes raw query-param input, which need not be a string
 * (Hapi parses a repeated param as an array). Zero-padded `YYYY-MM` values
 * order lexicographically, so the range check is plain string comparison.
 * @param {unknown} monthValue
 * @param {Date} now
 * @returns {monthValue is string}
 */
export const isValidReportMonth = (monthValue, now) =>
  typeof monthValue === 'string' &&
  MONTH_PATTERN.test(monthValue) &&
  monthValue >= EARLIEST_REPORT_MONTH &&
  monthValue <= previousReportMonth(now)

/**
 * The report cutoff for a month: midnight Europe/London on the 1st of the
 * following month, as a UTC instant. At that naive UTC midnight the London
 * clock reads 00:00 (GMT) or 01:00 (BST); subtracting that hour gives the
 * instant London midnight actually happened. UK DST never changes within an
 * hour of a month boundary, so the single adjustment is exact.
 * @param {string} monthValue - A validated `YYYY-MM` report month.
 * @returns {Date}
 */
export const cutoffForReportMonth = (monthValue) => {
  const [year, month] = monthValue.split('-').map(Number)
  // The 1-based month used as a 0-based month index is the following month.
  const naiveUtcMidnight = Date.UTC(year, month, 1)
  const londonHour = Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: LONDON_TIME_ZONE,
      hour: 'numeric',
      hourCycle: 'h23'
    }).format(naiveUtcMidnight)
  )
  return new Date(naiveUtcMidnight - londonHour * MILLISECONDS_PER_HOUR)
}
