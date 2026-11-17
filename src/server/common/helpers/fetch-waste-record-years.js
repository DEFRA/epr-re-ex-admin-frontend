import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'

/**
 * @import { HapiRequest } from '#server/common/hapi-types.js'
 */

/**
 * The years waste records are available for, in the order the backend serves
 * them: newest first.
 * @param {HapiRequest} request
 * @returns {Promise<string[]>}
 */
export const fetchWasteRecordYears = async (request) => {
  const { years } = await fetchJsonFromBackend(
    request,
    '/waste-records/years',
    {}
  )
  return years.map(({ year }) => String(year))
}
