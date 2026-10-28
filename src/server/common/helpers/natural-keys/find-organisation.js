import { statusCodes } from '#server/common/constants/status-codes.js'
import { errorCodes } from '#server/common/enums/error-codes.js'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { notFound } from '#server/common/helpers/logging/cdp-boom.js'

/**
 * @import { Boom } from '@hapi/boom'
 * @import { HapiRequest } from '#server/common/hapi-types.js'
 *
 * @typedef {{ id: string, registrationNumber?: string, accreditationId?: string }} StoredRegistration
 * @typedef {{ id: string, accreditationNumber?: string, validFrom?: string }} StoredAccreditation
 * @typedef {{
 *   orgId: number,
 *   registrations: StoredRegistration[],
 *   accreditations: StoredAccreditation[]
 * }} StoredOrganisation
 */

const REFUSED = Object.freeze([statusCodes.forbidden, statusCodes.notFound])

/**
 * A 403 or 404 means the admin cannot see the record, which is the same as no
 * record.
 * @template T
 * @param {Promise<T>} lookup
 * @returns {Promise<T | null>}
 */
const nullWhenRefused = async (lookup) => {
  try {
    return await lookup
  } catch (error) {
    if (REFUSED.includes(/** @type {Boom} */ (error).output.statusCode)) {
      return null
    }

    throw error
  }
}

/**
 * The stored organisation, or `null` when the admin cannot see it.
 * @param {HapiRequest} request
 * @param {string} organisationId
 * @returns {Promise<StoredOrganisation | null>}
 */
export const findOrganisationById = (request, organisationId) =>
  nullWhenRefused(
    fetchJsonFromBackend(request, `/v1/organisations/${organisationId}`, {})
  )

/**
 * The database id of the organisation with this number. The JSON editor and
 * the form submission data are still read by id.
 * @param {HapiRequest} request
 * @param {string} organisationNumber
 * @returns {Promise<string>}
 */
export const findOrganisationIdByNumber = async (
  request,
  organisationNumber
) => {
  const query = new URLSearchParams({
    orgId: organisationNumber,
    page: '1',
    pageSize: '1'
  })
  const { items } = await fetchJsonFromBackend(
    request,
    `/v1/organisations?${query}`,
    {}
  )

  if (items.length === 0) {
    throw notFound('Organisation not found', errorCodes.organisationNotFound, {
      event: {
        action: 'find_organisation_id',
        reason: `organisationNumber=${organisationNumber}`
      }
    })
  }

  return items[0].id
}
