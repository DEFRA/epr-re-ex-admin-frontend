import Boom from '@hapi/boom'

import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { statusCodes } from '#server/common/constants/status-codes.js'
import { orsUploadRoutes } from './constants.js'
import {
  csvAttachment,
  overseasSiteCsvHeaders,
  overseasSiteCsvValues,
  toCsv,
  toCsvValue
} from './overseas-sites-csv.js'

/**
 * @import { ResponseToolkit } from '@hapi/hapi'
 * @import { HapiRequest } from '#server/common/hapi-types.js'
 * @import { CsvValue, OverseasSiteRow } from './overseas-sites-csv.js'
 */

/**
 * One site on one registration application, as
 * `GET /v1/admin/registration-service/overseas-sites` returns it.
 * @typedef {OverseasSiteRow & {
 *   year: number,
 *   applicationReference: string | null,
 *   applicationStatus: string,
 *   siteId: number,
 *   selected: boolean,
 *   formattedAddress: string | null
 * }} RegistrationServiceSiteRow
 */

/** @type {Record<number, string>} */
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

/**
 * @param {RegistrationServiceSiteRow} row
 * @returns {CsvValue[]}
 */
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

/** @param {RegistrationServiceSiteRow[]} rows */
function generateCsv(rows) {
  return toCsv([
    [...overseasSiteCsvHeaders, ...applicationCsvHeaders],
    ...rows.map((row) => [
      ...overseasSiteCsvValues(row),
      ...applicationCsvValues(row)
    ])
  ])
}

export const registrationServiceDownloadController = {
  /**
   * @param {HapiRequest} request
   * @param {ResponseToolkit} h
   */
  async handler(request, h) {
    try {
      /** @type {{ rows: RegistrationServiceSiteRow[] }} */
      const { rows } = await fetchJsonFromBackend(
        request,
        '/v1/admin/registration-service/overseas-sites'
      )

      return csvAttachment(
        h,
        await generateCsv(rows),
        'overseas-reprocessing-sites-registration-service.csv'
      )
    } catch (error) {
      const statusCode = Boom.isBoom(error) ? error.output.statusCode : null
      request.yar.set(
        'error',
        (statusCode && errorMessages[statusCode]) ?? defaultErrorMessage
      )

      return h.redirect(orsUploadRoutes.list)
    }
  }
}
