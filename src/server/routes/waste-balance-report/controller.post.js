import { writeToString } from '@fast-csv/format'

import { createLogger } from '#server/common/helpers/logging/logger.js'
import { sanitizeFormulaInjection } from '#server/common/helpers/sanitize-formula-injection.js'
import { fetchWasteBalanceReport } from './fetch-report.js'
import { isValidReportMonth } from './months.js'

/**
 * @import { WasteBalanceReport } from './types.js'
 */

const logger = createLogger()

const TOTALS_HEADER = [
  'material',
  'type',
  'total_balance',
  'total_available_balance'
]

const ACCREDITATIONS_HEADER = [
  'org_id',
  'registration_number',
  'accreditation_number',
  'material',
  'type',
  'balance',
  'available_balance'
]

/**
 * The two-section CSV: per-material totals, a blank line, then
 * per-accreditation rows — each section with its own header, both in the
 * report's canonical order, with raw (unformatted) numbers. Identifier cells
 * pass through formula-injection sanitisation.
 * @param {WasteBalanceReport} report
 * @returns {Promise<string>}
 */
const generateCsv = async (report) => {
  const totalsSection = await writeToString(
    [
      TOTALS_HEADER,
      ...report.totals.map((total) => [
        total.material,
        total.wasteProcessingType,
        total.amount,
        total.availableAmount
      ])
    ],
    { headers: false }
  )

  const accreditationsSection = await writeToString(
    [
      ACCREDITATIONS_HEADER,
      ...report.accreditations.map((accreditation) => [
        sanitizeFormulaInjection(accreditation.orgId),
        sanitizeFormulaInjection(accreditation.registrationNumber),
        sanitizeFormulaInjection(accreditation.accreditationNumber),
        accreditation.material,
        accreditation.wasteProcessingType,
        accreditation.amount,
        accreditation.availableAmount
      ])
    ],
    { headers: false }
  )

  return `${totalsSection}\n\n${accreditationsSection}`
}

export const wasteBalanceReportPostController = {
  async handler(request, h) {
    const { month } = request.payload ?? {}
    const now = new Date()

    if (!isValidReportMonth(month, now)) {
      request.yar.set('error', 'Select a month from the list')
      return h.redirect('/waste-balance-report')
    }

    try {
      const report = await fetchWasteBalanceReport(request, month)
      const csv = await generateCsv(report)

      return h
        .response(csv)
        .header('Content-Type', 'text/csv')
        .header(
          'Content-Disposition',
          `attachment; filename="waste-balance-report-${month}.csv"`
        )
    } catch (error) {
      logger.error({
        message: 'Failed to generate the waste balance report CSV',
        err: error
      })

      request.yar.set(
        'error',
        'There was a problem downloading the waste balance report. Please try again.'
      )

      return h.redirect(`/waste-balance-report?month=${month}`)
    }
  }
}
