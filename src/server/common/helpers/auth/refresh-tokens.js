import * as openid from 'openid-client'
import { getScopesForAuth } from './get-scopes-for-auth.js'
import { config } from '#config/config.js'

async function refreshTokens(jwtRefreshToken) {
  const clientId = config.get('entraId.clientId')
  const clientSecret = config.get('entraId.clientSecret')
  const wellKnown = config.get('entraId.oidcWellKnownConfigurationUrl')

  const openIdConfig = await openid.discovery(
    new URL(wellKnown),
    clientId,
    clientSecret
  )

  const scope = getScopesForAuth().join(' ')

  return openid.refreshTokenGrant(openIdConfig, jwtRefreshToken, {
    scope
  })
}

export { refreshTokens }
