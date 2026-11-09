/**
 * @import { Brand } from './brand.js'
 */

/**
 * A bare `YYYY-MM-DD` calendar date, compared lexicographically against the
 * dates the backend serves.
 * @typedef {Brand<string, 'CalendarDate'>} CalendarDate
 */

/**
 * The calendar date an instant falls on **in UTC**. Named for the zone because
 * the answer is zone-dependent: half past midnight on a British summer morning
 * is still the previous day in UTC.
 * @param {Date} date
 * @returns {CalendarDate}
 */
export const utcCalendarDate = (date) =>
  /** @type {CalendarDate} */ (date.toISOString().slice(0, 10))
