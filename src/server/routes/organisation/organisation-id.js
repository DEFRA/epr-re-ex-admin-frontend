import { findOrganisationIdByNumber } from '#server/common/helpers/natural-keys/find-organisation.js'

/** @import { HapiRequest } from '#server/common/hapi-types.js' */

/**
 * The editor reads and writes the stored document by id, whichever key its
 * address names.
 * @param {HapiRequest} request
 * @returns {Promise<string>}
 */
export const organisationIdOf = async (request) => {
  const { id, organisationNumber } =
    /** @type {{ id?: string, organisationNumber: string }} */ (request.params)

  return id ?? findOrganisationIdByNumber(request, organisationNumber)
}
