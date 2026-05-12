/**
 * @import { HapiRequest } from '#server/common/hapi-types.js'
 */

/**
 * Cast a test-fabric object to HapiRequest. The handler under test only reads
 * the fields the caller actually provides; tsc can't see that, so this helper
 * makes the bounded cast explicit at the test/production boundary.
 *
 * @param {object} [partial]
 * @returns {HapiRequest}
 */
export const asHapiRequest = (partial = {}) =>
  /** @type {HapiRequest} */ (/** @type {unknown} */ (partial))
