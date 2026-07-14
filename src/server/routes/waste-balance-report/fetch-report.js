import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { cutoffForReportMonth } from './months.js'

/**
 * @import { HapiRequest } from '#server/common/hapi-types.js'
 * @import { WasteBalanceReport } from './types.js'
 */

/**
 * Fetch the waste balance report for a report month. Maps the month to its
 * Europe/London closing cutoff and calls the backend. The view and download
 * controllers both go through this one helper so the on-page tables and the
 * CSV cannot drift apart.
 * @param {HapiRequest} request
 * @param {string} monthValue - A validated `YYYY-MM` report month.
 * @returns {Promise<WasteBalanceReport>}
 */
export const fetchWasteBalanceReport = (request, monthValue) => {
  const cutoff = cutoffForReportMonth(monthValue).toISOString()
  return fetchJsonFromBackend(
    request,
    `/v1/admin/waste-balances/report?cutoff=${encodeURIComponent(cutoff)}`
  )
}
