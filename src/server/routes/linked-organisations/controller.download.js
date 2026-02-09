import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { formatDate } from '#config/nunjucks/filters/format-date.js'
import { buildBackendPath, mapLinkedOrganisations } from './helpers.js'

const dateFormat = "d MMMM yyyy 'at' h:mmaaa"

function escapeCsvField(value) {
  const stringValue = String(value ?? '')

  // Mitigate CSV/Excel formula injection by prefixing risky leading characters
  const prefixedValue = /^[=+\-@]/.test(stringValue)
    ? `'${stringValue}`
    : stringValue

  if (
    prefixedValue.includes(',') ||
    prefixedValue.includes('"') ||
    prefixedValue.includes('\n')
  ) {
    return `"${prefixedValue.replace(/"/g, '""')}"`
  }
  return prefixedValue
}

function generateCsv(data) {
  const lines = [
    'EPR Organisation Name,EPR Organisation ID,Registration Number,Defra ID Organisation Name,Defra ID Organisation ID,Date Linked,Linked By'
  ]

  const linkedOrganisations = mapLinkedOrganisations(data)

  for (const org of linkedOrganisations) {
    lines.push(
      [
        escapeCsvField(org.eprOrgName),
        escapeCsvField(org.eprOrgId),
        escapeCsvField(org.registrationNumber),
        escapeCsvField(org.defraOrgName),
        escapeCsvField(org.defraOrgId),
        escapeCsvField(formatDate(org.linkedAt, dateFormat)),
        escapeCsvField(org.linkedByEmail)
      ].join(',')
    )
  }

  return lines.join('\n')
}

export const linkedOrganisationsDownloadController = {
  async handler(request, h) {
    try {
      const searchTerm = request.payload?.search?.trim() || ''
      const data = await fetchJsonFromBackend(
        request,
        buildBackendPath(searchTerm)
      )
      const csv = generateCsv(data)

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
