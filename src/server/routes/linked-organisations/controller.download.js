import { writeToString } from '@fast-csv/format'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { formatDate } from '#config/nunjucks/filters/format-date.js'
import { sanitizeFormulaInjection } from '#server/common/helpers/sanitize-formula-injection.js'
import { buildBackendPath, mapLinkedOrganisations } from './helpers.js'

const dateFormat = "d MMMM yyyy 'at' h:mmaaa"

async function generateCsv(data) {
  const rows = [
    [
      'EPR Organisation Name',
      'EPR Organisation ID',
      'Registration Number',
      'Defra ID Organisation Name',
      'Defra ID Organisation ID',
      'Date Linked',
      'Linked By'
    ]
  ]

  const linkedOrganisations = mapLinkedOrganisations(data)

  for (const org of linkedOrganisations) {
    rows.push([
      sanitizeFormulaInjection(org.eprOrgName),
      org.eprOrgId,
      org.registrationNumber,
      sanitizeFormulaInjection(org.defraOrgName),
      org.defraOrgId,
      formatDate(org.linkedAt, dateFormat),
      sanitizeFormulaInjection(org.linkedByEmail)
    ])
  }

  return writeToString(rows, { headers: false, quoteColumns: true })
}

export const linkedOrganisationsDownloadController = {
  async handler(request, h) {
    try {
      const searchTerm = request.payload?.search?.trim() || ''
      const data = await fetchJsonFromBackend(
        request,
        buildBackendPath(searchTerm)
      )
      const csv = await generateCsv(data)

      return h
        .response(csv)
        .header('Content-Type', 'text/csv')
        .header(
          'Content-Disposition',
          'attachment; filename="linked-organisations.csv"'
        )
    } catch (error) {
      const errorMessage =
        error.output?.payload?.message ||
        'There was a problem downloading the linked organisations data. Please try again.'

      request.yar.set('error', errorMessage)

      return h.redirect('/linked-organisations')
    }
  }
}
