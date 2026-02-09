import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { formatDate } from '#config/nunjucks/filters/format-date.js'

const dateFormat = "d MMMM yyyy 'at' h:mmaaa"

function escapeCsvField(value) {
  const stringValue = String(value ?? '')
  if (
    stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n')
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

function buildBackendPath(searchTerm) {
  if (searchTerm) {
    return `/v1/linked-organisations?name=${encodeURIComponent(searchTerm)}`
  }
  return '/v1/linked-organisations'
}

function generateCsv(data) {
  const lines = [
    'EPR Organisation Name,EPR Organisation ID,Registration Number,Defra ID Organisation Name,Defra ID Organisation ID,Date Linked,Linked By'
  ]

  const linkedOrganisations = (Array.isArray(data) ? data : []).map(
    ({
      orgId,
      companyDetails: { name, registrationNumber },
      linkedDefraOrganisation: {
        orgId: defraOrgId,
        orgName,
        linkedAt,
        linkedBy
      }
    }) => ({
      eprOrgName: name,
      eprOrgId: orgId,
      registrationNumber,
      defraOrgName: orgName,
      defraOrgId,
      linkedAt,
      linkedByEmail: linkedBy.email
    })
  )

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
