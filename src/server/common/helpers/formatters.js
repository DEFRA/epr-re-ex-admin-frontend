import { formatDate } from '#config/nunjucks/filters/format-date.js'

const dateTimeFormat = "d MMMM yyyy 'at' h:mmaaa"

/**
 * Formats an ISO date string
 * @param {string} isoString - ISO 8601 date string
 * @returns {string} Formatted date string (e.g., "6 February 2026 at 2:30pm") or empty string if no date
 */
export function formatDateTime(isoString) {
  if (!isoString) return ''
  return formatDate(new Date(isoString), dateTimeFormat)
}
