import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { statusCodes } from '#server/common/constants/status-codes.js'
import { orsUploadRoutes } from './constants.js'
import {
  backendRows,
  csvAttachment,
  overseasSiteCsvHeaders,
  overseasSiteCsvValues,
  toCsv,
  toCsvValue
} from './overseas-sites-csv.js'

const errorMessages = {
  [statusCodes.badGateway]:
    'The registration service did not respond. Please try again later.',
  [statusCodes.serviceUnavailable]:
    'The registration service is not connected in this environment.'
}

const defaultErrorMessage =
  'There was a problem downloading the registration service overseas reprocessing site data. Please try again.'

const applicationCsvHeaders = [
  'Application reference',
  'Application status',
  'Year',
  'Selected',
  'Site ID',
  'Formatted address'
]

function applicationCsvValues(row) {
  return [
    toCsvValue(row.applicationReference),
    toCsvValue(row.applicationStatus),
    toCsvValue(row.year),
    row.selected ? 'Yes' : 'No',
    toCsvValue(row.siteId),
    toCsvValue(row.formattedAddress)
  ]
}

function generateCsv(data) {
  return toCsv([
    [...overseasSiteCsvHeaders, ...applicationCsvHeaders],
    ...backendRows(data).map((row) => [
      ...overseasSiteCsvValues(row),
      ...applicationCsvValues(row)
    ])
  ])
}

export const registrationServiceDownloadController = {
  async handler(request, h) {
    try {
      const data = await fetchJsonFromBackend(
        request,
        '/v1/admin/registration-service/overseas-sites'
      )

      return csvAttachment(
        h,
        await generateCsv(data),
        'overseas-reprocessing-sites-registration-service.csv'
      )
    } catch (error) {
      request.yar.set(
        'error',
        errorMessages[error.output?.statusCode] ?? defaultErrorMessage
      )

      return h.redirect(orsUploadRoutes.list)
    }
  }
}
