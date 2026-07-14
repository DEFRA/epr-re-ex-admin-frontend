import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { cutoffForReportMonth } from './months.js'

/**
 * @import { HapiRequest } from '#server/common/hapi-types.js'
 * @import { WasteBalanceReport, WasteBalanceReportAccreditation, WasteBalanceReportTotal } from './types.js'
 */

// Pinned locale and numeric collation so the canonical order is identical in
// every environment and ACC-10 sorts after ACC-9.
const collator = new Intl.Collator('en', { numeric: true })

/**
 * @param {string} a
 * @param {string} b
 */
const compareStrings = (a, b) => collator.compare(a, b)

/**
 * @param {WasteBalanceReportTotal} a
 * @param {WasteBalanceReportTotal} b
 */
const byMaterialThenType = (a, b) =>
  compareStrings(a.material, b.material) ||
  compareStrings(a.wasteProcessingType, b.wasteProcessingType)

/**
 * @param {WasteBalanceReportAccreditation} a
 * @param {WasteBalanceReportAccreditation} b
 */
const byMaterialTypeThenAccreditation = (a, b) =>
  byMaterialThenType(a, b) ||
  compareStrings(a.accreditationNumber, b.accreditationNumber)

/**
 * Fetch the waste balance report for a report month. Maps the month to its
 * Europe/London closing cutoff, calls the backend, and returns the report in
 * its canonical order — totals by material then type, accreditations by
 * material, type, then accreditation number. The view and download
 * controllers both go through this one helper so the on-page tables and the
 * CSV cannot drift apart, in content or in order.
 * @param {HapiRequest} request
 * @param {string} monthValue - A validated `YYYY-MM` report month.
 * @returns {Promise<WasteBalanceReport>}
 */
export const fetchWasteBalanceReport = async (request, monthValue) => {
  const cutoff = cutoffForReportMonth(monthValue).toISOString()

  /** @type {WasteBalanceReport} */
  const report = await fetchJsonFromBackend(
    request,
    `/v1/admin/waste-balances/report?cutoff=${encodeURIComponent(cutoff)}`
  )

  return {
    ...report,
    totals: [...report.totals].sort(byMaterialThenType),
    accreditations: [...report.accreditations].sort(
      byMaterialTypeThenAccreditation
    )
  }
}
