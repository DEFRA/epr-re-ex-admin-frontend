import { writeToString } from '@fast-csv/format'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { formatDate } from '#config/nunjucks/filters/format-date.js'
import { sanitizeFormulaInjection } from '#server/common/helpers/sanitize-formula-injection.js'

const dateFormat = "d MMMM yyyy 'at' h:mmaaa"

function getDisplayName(org) {
  if (!org) return ''
  return org.tradingName || org.name || ''
}

function generateCsv(data) {
  const items = data?.items || []

  const rows = [
    [
      'PRN Number',
      'Status',
      'Issued To',
      'Tonnage',
      'Material',
      'Process To Be Used',
      'December Waste',
      'Notes',
      'Issued Date',
      'Issued By',
      'Position',
      'Accreditation Year',
      'Organisation Name',
      'Waste Processing Type'
    ]
  ]

  for (const prn of items) {
    rows.push([
      sanitizeFormulaInjection(prn.prnNumber || ''),
      sanitizeFormulaInjection(prn.status || ''),
      sanitizeFormulaInjection(getDisplayName(prn.issuedToOrganisation)),
      prn.tonnage,
      sanitizeFormulaInjection(prn.material || ''),
      sanitizeFormulaInjection(prn.processToBeUsed || ''),
      prn.isDecemberWaste ? 'Yes' : 'No',
      sanitizeFormulaInjection(prn.notes || ''),
      prn.issuedAt ? formatDate(prn.issuedAt, dateFormat) : '',
      sanitizeFormulaInjection(prn.issuedBy?.name || ''),
      sanitizeFormulaInjection(prn.issuedBy?.position || ''),
      prn.accreditationYear ?? '',
      sanitizeFormulaInjection(prn.organisationName || ''),
      sanitizeFormulaInjection(prn.wasteProcessingType || '')
    ])
  }

  return writeToString(rows, { headers: false, quoteColumns: true })
}

export const prnActivityDownloadController = {
  async handler(request, h) {
    try {
      const data = await fetchJsonFromBackend(
        request,
        '/v1/admin/packaging-recycling-notes?statuses=awaiting_acceptance'
      )
      const csv = await generateCsv(data)

      return h
        .response(csv)
        .header('Content-Type', 'text/csv')
        .header(
          'Content-Disposition',
          'attachment; filename="prn-activity.csv"'
        )
    } catch (error) {
      const errorMessage =
        error.output?.payload?.message ||
        'There was a problem downloading the PRN activity data. Please try again.'

      request.yar.set('error', errorMessage)

      return h.redirect('/prn-activity')
    }
  }
}
