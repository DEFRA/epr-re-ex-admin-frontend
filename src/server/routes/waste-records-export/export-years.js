const FIRST_EXPORT_YEAR = 2026

/**
 * The years the full export offers, oldest first: from the first year with
 * waste records to the current one, read in UTC.
 * @param {Date} [now]
 * @returns {string[]}
 */
export const exportYears = (now = new Date()) =>
  Array.from({ length: now.getUTCFullYear() - FIRST_EXPORT_YEAR + 1 }, (_, i) =>
    String(FIRST_EXPORT_YEAR + i)
  )
