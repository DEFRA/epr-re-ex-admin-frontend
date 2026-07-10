import { makeToken } from './test-constants.js'

/** @import { HapiRequest } from '#server/common/hapi-types.js' */

export const mockUserSession = {
  userId: 'user-id',
  email: 'user@email.com',
  sessionId: '123',
  displayName: ' John Doe',
  isAuthenticated: true,
  scopes: ['admin.read', 'admin.write', 'admin.dlq.purge'],
  token: makeToken('user-token'),
  refreshToken: makeToken('refresh-token')
}

/**
 * @param {unknown} req
 * @returns {HapiRequest}
 */
export const asRequest = (req) => /** @type {HapiRequest} */ (req)

/**
 * @param {{ message?: string, statusCode?: number, payloadMessage?: string }} [options]
 * @returns {Error & { output: { statusCode?: number, payload?: { message?: string } } }}
 */
export const boomError = ({
  message = 'error',
  statusCode,
  payloadMessage
} = {}) => {
  const error =
    /** @type {Error & { output: { statusCode?: number, payload?: { message?: string } } }} */ (
      new Error(message)
    )
  error.output = {}
  if (statusCode !== undefined) {
    error.output.statusCode = statusCode
  }
  if (payloadMessage !== undefined) {
    error.output.payload = { message: payloadMessage }
  }
  return error
}
