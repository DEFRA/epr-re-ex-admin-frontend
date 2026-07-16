import { writeToString } from '@fast-csv/format'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { sanitizeFormulaInjection } from '#server/common/helpers/sanitize-formula-injection.js'
import { createLogger } from '#server/common/helpers/logging/logger.js'

const logger = createLogger()

const tonnageDecimals = 2

/**
 * Render an ISO timestamp as a filename-safe token, e.g.
 * `2026-07-16T12:00:00.000Z` becomes `2026-07-16T12-00-00Z`.
 * @param {string} isoTimestamp
 * @returns {string}
 */
function toFilenameTimestamp(isoTimestamp) {
  return isoTimestamp.replace(/\.\d+Z$/, 'Z').replace(/:/g, '-')
}

/**
 * @param {import('./types.js').CreditedTonnageApiRow} row
 * @returns {string[]}
 */
function buildDataRow(row) {
  return [
    sanitizeFormulaInjection(row.month),
    sanitizeFormulaInjection(row.organisation.reference),
    sanitizeFormulaInjection(row.accreditation.accreditationNumber),
    sanitizeFormulaInjection(row.accreditation.material),
    sanitizeFormulaInjection(row.accreditation.processingType),
    row.tonnage.totalCredited.toFixed(tonnageDecimals),
    row.tonnage.eligibleForWasteBalance.toFixed(tonnageDecimals),
    row.tonnage.deductibleFromCredited.toFixed(tonnageDecimals)
  ]
}

/**
 * @param {import('./types.js').CreditedTonnageApiRow[]} data
 * @returns {Promise<string>}
 */
function generateCsv(data) {
  /** @type {string[][]} */
  const rows = [
    [
      'month',
      'organisation_id',
      'accreditation_number',
      'material',
      'processing_type',
      'total_credited',
      'eligible_for_waste_balance',
      'deductible_from_credited'
    ]
  ]

  for (const row of data) {
    rows.push(buildDataRow(row))
  }

  return writeToString(rows, { headers: false })
}

export const creditedTonnagePostController = {
  async handler(request, h) {
    try {
      const data = await fetchJsonFromBackend(
        request,
        '/v1/admin/waste-balances/credited-tonnage'
      )

      const csv = await generateCsv(data.data)
      const filename = `credited-tonnage-${toFilenameTimestamp(data.meta.generatedAt)}.csv`

      return h
        .response(csv)
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', `attachment; filename="${filename}"`)
    } catch (error) {
      logger.error({
        message: 'Failed to generate credited tonnage CSV',
        err: error
      })

      const errorMessage =
        error.output?.payload?.message ||
        'There was a problem downloading the credited tonnage data. Please try again.'

      request.yar.set('error', errorMessage)

      return h.redirect('/credited-tonnage')
    }
  }
}
