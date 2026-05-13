import * as jose from 'jose'
import { getOidcConfig } from './get-oidc-config.js'
import { config } from '#config/config.js'

/**
 * @typedef {Object} EntraIdTokenPayload
 * @property {string} [oid]
 * @property {string} [name]
 * @property {string} [preferred_username]
 * @property {string} [email]
 * @property {string} [login_hint]
 */

/**
 * @param {string} token
 * @returns {Promise<EntraIdTokenPayload>}
 */
async function verifyToken(token) {
  const { jwks_uri: uri } = await getOidcConfig()
  const clientId = config.get('entraId.clientId')
  const tenantId = config.get('entraId.tenantId')

  const JWKS = jose.createRemoteJWKSet(new URL(uri))

  const { payload } = await jose.jwtVerify(token, JWKS, {
    algorithms: ['RS256'],
    audience: clientId,
    issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`
  })

  return /** @type {EntraIdTokenPayload} */ (/** @type {unknown} */ (payload))
}

export { verifyToken }
