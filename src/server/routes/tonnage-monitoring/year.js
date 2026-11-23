import { fetchWasteRecordYears } from '#server/common/helpers/fetch-waste-record-years.js'

/**
 * @import { HapiRequest } from '#server/common/hapi-types.js'
 */

export const tonnageMonitoringPath = '/tonnage-monitoring'

/**
 * @param {string} year
 */
export const tonnageMonitoringUrl = (year) =>
  `${tonnageMonitoringPath}?year=${encodeURIComponent(year)}`

/**
 * The years the report can be shown for, newest first, and the year the URL
 * asks for when it is one of them.
 *
 * @param {HapiRequest} request
 * @returns {Promise<{ years: string[], year: string | undefined }>}
 */
export const tonnageMonitoringYears = async (request) => {
  const years = await fetchWasteRecordYears(request)
  const asked = request.query.year
  return { years, year: years.find((year) => year === asked) }
}

/**
 * The year shown when the URL names none the report can be shown for: the
 * current year, or the newest one.
 *
 * @param {string[]} years
 * @returns {string}
 */
export const defaultYear = (years) => {
  const currentYear = String(new Date().getUTCFullYear())
  return years.includes(currentYear) ? currentYear : years[0]
}
