import { statusCodes } from '#server/common/constants/status-codes.js'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { fetchOrganisationOverview } from '#server/common/helpers/fetch-organisation-overview.js'

/**
 * @import { Boom } from '@hapi/boom'
 * @import { HapiRequest } from '#server/common/hapi-types.js'
 * @import { OrganisationOverview } from '#server/common/helpers/fetch-organisation-overview.js'
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
 * @param {HapiRequest} request
 * @param {string} organisationId
 * @returns {Promise<OrganisationOverview | null>}
 */
export const findOverviewById = (request, organisationId) =>
  nullWhenRefused(fetchOrganisationOverview(request, organisationId))

/**
 * @param {HapiRequest} request
 * @param {string} organisationNumber
 * @returns {Promise<OrganisationOverview | null>}
 */
export const findOverviewByNumber = async (request, organisationNumber) => {
  const query = new URLSearchParams({
    orgId: organisationNumber,
    page: '1',
    pageSize: '1'
  })
  /** @type {{ items: { id: string, orgId: number }[] } | null} */
  const page = await nullWhenRefused(
    fetchJsonFromBackend(request, `/v1/organisations?${query}`)
  )

  const [match] = page?.items ?? []

  return match && String(match.orgId) === organisationNumber
    ? findOverviewById(request, match.id)
    : null
}
