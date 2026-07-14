/**
 * Per-material total in the waste balance report. Mirrors the shape returned
 * by `GET /v1/admin/waste-balances/report` on epr-backend.
 * @typedef {{
 *   material: string
 *   wasteProcessingType: string
 *   amount: number
 *   availableAmount: number
 * }} WasteBalanceReportTotal
 */

/**
 * Per-accreditation row in the waste balance report. `orgId` is the
 * organisation's external reference, not its internal id.
 * @typedef {{
 *   orgId: string
 *   registrationNumber: string
 *   accreditationNumber: string
 *   material: string
 *   wasteProcessingType: string
 *   amount: number
 *   availableAmount: number
 * }} WasteBalanceReportAccreditation
 */

/**
 * Waste balance report as at a cutoff instant: per-material totals across
 * reprocessors and exporters, then per-accreditation balances.
 * @typedef {{
 *   cutoff: string
 *   totals: WasteBalanceReportTotal[]
 *   accreditations: WasteBalanceReportAccreditation[]
 * }} WasteBalanceReport
 */

export {} // NOSONAR: javascript:S7787 - Required to make this file a module for JSDoc @import
