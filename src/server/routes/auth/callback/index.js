import { config } from '../../../../config/config.js'
import { fetchJson } from '../fetch-json.js'
import { fetchWellknown } from '../fetch-well-known.js'
import { createLogger } from '../../../common/helpers/logging/logger.js'
import {
  readFromSession,
  writeToSession
} from '../../../session-storage/index.js'

const logger = createLogger()

export async function GET(request, h) {
  const { code, state } = request.query

  try {
    const { token_endpoint: aadTokenEndpoint } = await fetchWellknown()

    const params = new URLSearchParams({
      client_id: config.get('oidc.azureAD.clientId'),
      client_secret: config.get('oidc.azureAD.clientSecret'),
      code,
      grant_type: 'authorization_code',
      redirect_uri: `${config.get('appBaseUrl')}/auth/callback`,
      code_verifier: readFromSession(`auth:pkce:${state}`)
    })

    const { payload: tokenResponse } = await fetchJson(aadTokenEndpoint, {
      method: 'POST',
      payload: params.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    const [, payload] = tokenResponse.id_token.split('.') // header.payload.signature

    writeToSession('user', {
      username: parse(payload).preferred_username
    })

    return h.redirect('/')
  } catch (error) {
    logger.error(error?.data?.payload)
    throw error
  }
}

function parse(raw) {
  const base64 = raw.replace(/-/g, '+').replace(/_/g, '/')

  const binary = Buffer.from(base64, 'base64').toString('binary')

  const jsonPayload = decodeURIComponent(
    binary
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  )
  return JSON.parse(jsonPayload)
}
