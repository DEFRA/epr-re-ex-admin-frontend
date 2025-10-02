import { config } from '../../../../config/config.js'
import { fetchWellknown } from '../fetch-well-known.js'
import crypto from 'crypto'
import { writeToSession } from '../../../session-storage/index.js'

export async function GET(_request, h) {
  const { authorization_endpoint: aadAuthEndpoint } = await fetchWellknown()

  const state = generateStateParameter()
  const { codeVerifier, codeChallenge } = generatePkceChallenge()

  writeToSession(`auth:pkce:${state}`, codeVerifier)

  const params = new URLSearchParams({
    client_id: config.get('oidc.azureAD.clientId'),
    response_type: 'code',
    redirect_uri: `${config.get('appBaseUrl')}/auth/callback`,
    response_mode: 'query',
    scope: 'openid profile email',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  })

  const authorizationUrl = `${aadAuthEndpoint}?${params.toString()}`

  return h.redirect(authorizationUrl)
}

function generateStateParameter() {
  return crypto.randomBytes(32).toString('base64url')
}

function generatePkceChallenge() {
  const codeVerifier = crypto.randomBytes(32).toString('base64url')
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url')

  return {
    codeVerifier,
    codeChallenge
  }
}
