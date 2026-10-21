import { statusCodes } from '#server/common/constants/status-codes.js'

/**
 * @import { ResponseToolkit } from '@hapi/hapi'
 * @import { HapiRequest } from '#server/common/hapi-types.js'
 */

/**
 * Redirects to `path`, keeping the query string. A read is a 302; anything
 * else is a 307, so the browser resends its body.
 * @param {HapiRequest} request
 * @param {ResponseToolkit} h
 * @param {string} path
 */
export const redirectKeepingMethod = (request, h, path) =>
  h
    .redirect(`${path}${request.url.search}`)
    .code(
      request.method === 'get'
        ? statusCodes.found
        : statusCodes.temporaryRedirect
    )
    .takeover()
