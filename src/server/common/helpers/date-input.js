/**
 * Builds a YYYY-MM-DD date from GDS date-input parts, or null when the parts
 * do not form a real calendar date.
 * @param {string} day
 * @param {string} month
 * @param {string} year
 * @returns {string | null}
 */
export const dateInputToIsoDate = (day, month, year) => {
  if (
    !/^\d{1,2}$/.test(day) ||
    !/^\d{1,2}$/.test(month) ||
    !/^\d{4}$/.test(year)
  ) {
    return null
  }

  const iso = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  const date = new Date(`${iso}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime()) || !date.toISOString().startsWith(iso)) {
    return null
  }

  return iso
}
