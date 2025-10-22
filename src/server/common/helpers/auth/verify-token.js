import * as jose from 'jose'
import { getOidcConfig } from './get-oidc-config.js'

async function verifyToken(token) {
  const { jwks_uri: uri } = await getOidcConfig()

  const JWKS = jose.createRemoteJWKSet(new URL(uri))

  const { payload } = await jose.jwtVerify(token, JWKS, {
    algorithms: ['RS256']
  })

  return payload
}

export { verifyToken }
