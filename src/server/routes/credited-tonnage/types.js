/**
 * A row returned by `GET /v1/admin/waste-balances/credited-tonnage` on
 * epr-backend: credited tonnage for one accreditation in one month.
 * @typedef {{
 *   month: string
 *   organisation: { id: string, reference: string }
 *   accreditation: {
 *     id: string
 *     accreditationNumber: string
 *     processingType: string
 *     material: string
 *   }
 *   tonnage: {
 *     totalCredited: number
 *     eligibleForWasteBalance: number
 *     sentOnDeductions: number
 *   }
 * }} CreditedTonnageApiRow
 */

/**
 * A materialised row ready for the credited tonnage table, with every cell
 * already formatted for display.
 * @typedef {{
 *   month: string
 *   organisationId: string
 *   accreditationNumber: string
 *   material: string
 *   type: string
 *   totalCredited: string
 *   eligibleForWasteBalance: string
 *   sentOnDeductions: string
 * }} CreditedTonnageRow
 */

export {} // NOSONAR: javascript:S7787 - Required to make this file a module for JSDoc @import
