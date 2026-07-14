import { statusCodes } from '#server/common/constants/status-codes.js'
import { createLogger } from '#server/common/helpers/logging/logger.js'
import { fetchWasteBalanceReport } from './fetch-report.js'
import { isValidReportMonth, reportMonthItems } from './months.js'

/**
 * @import { WasteBalanceReport } from './types.js'
 */

const logger = createLogger()

const VIEW = 'routes/waste-balance-report/index'
const PAGE_TITLE = 'Waste balance report'

/**
 * en-GB thousand separators for the on-page tables; the CSV download keeps
 * raw numbers. The fraction-digit ceiling stops toLocaleString's default
 * 3-decimal rounding from hiding precision the CSV would show.
 * @param {number} value
 */
const formatTonnage = (value) =>
  value.toLocaleString('en-GB', { maximumFractionDigits: 10 })

/**
 * govukTable rows for the per-material totals, in the report's canonical
 * order.
 * @param {WasteBalanceReport} report
 */
const totalsRows = (report) =>
  report.totals.map((total) => [
    { text: total.material },
    { text: total.wasteProcessingType },
    { text: formatTonnage(total.amount), format: 'numeric' },
    { text: formatTonnage(total.availableAmount), format: 'numeric' }
  ])

/**
 * govukTable rows for the per-accreditation balances, in the report's
 * canonical order.
 * @param {WasteBalanceReport} report
 */
const accreditationRows = (report) =>
  report.accreditations.map((accreditation) => [
    { text: accreditation.orgId },
    { text: accreditation.registrationNumber },
    { text: accreditation.accreditationNumber },
    { text: accreditation.material },
    { text: accreditation.wasteProcessingType },
    { text: formatTonnage(accreditation.amount), format: 'numeric' },
    { text: formatTonnage(accreditation.availableAmount), format: 'numeric' }
  ])

/**
 * The month select items, with the chosen month selected when the page is
 * re-rendering an existing report (page state lives in the URL).
 * @param {Date} now
 * @param {string} [selectedMonth]
 */
const monthItems = (now, selectedMonth) => {
  const items = reportMonthItems(now)
  if (!selectedMonth) {
    return items
  }
  return items.map((item) => ({
    ...item,
    selected: item.value === selectedMonth
  }))
}

export const wasteBalanceReportGetController = {
  async handler(request, h) {
    const flashError = request.yar.get('error')
    await request.yar.clear('error')

    const now = new Date()
    const { month } = request.query

    if (month === undefined) {
      return h.view(VIEW, {
        pageTitle: PAGE_TITLE,
        error: flashError,
        months: monthItems(now)
      })
    }

    if (!isValidReportMonth(month, now)) {
      return h
        .view(VIEW, {
          pageTitle: PAGE_TITLE,
          error: 'Select a month from the list',
          months: monthItems(now)
        })
        .code(statusCodes.badRequest)
    }

    try {
      const report = await fetchWasteBalanceReport(request, month)

      return h.view(VIEW, {
        pageTitle: PAGE_TITLE,
        error: flashError,
        months: monthItems(now, month),
        month,
        totalsRows: totalsRows(report),
        accreditationRows: accreditationRows(report)
      })
    } catch (error) {
      logger.error({
        message: 'Failed to fetch the waste balance report',
        err: error
      })

      // Rendering the error directly (rather than flash-and-redirect, as the
      // download POST does) keeps the month in the URL without redirecting a
      // failing GET back to itself.
      return h.view(VIEW, {
        pageTitle: PAGE_TITLE,
        error:
          'There was a problem retrieving the waste balance report. Please try again.',
        months: monthItems(now, month)
      })
    }
  }
}
