import * as openid from 'openid-client'
import { getScopesForAuth } from './get-scopes-for-auth.js'
import { config } from '#config/config.js'

const ONE_HOUR_MS = 60 * 60 * 1000

let cachedDiscovery = null
let cachedAt = 0
let inflight = null

async function getDiscoveryConfig() {
  if (cachedDiscovery && Date.now() - cachedAt < ONE_HOUR_MS) {
    return cachedDiscovery
  }

  // Coalesce concurrent calls into a single fetch. The shared promise
  // means all awaiters receive the same resolved value (or rejection).
  // Clearing inflight in finally is safe — it's idempotent and by that
  // point the result is already cached (or the error already propagated).
  if (!inflight) {
    inflight = fetchDiscoveryConfig()
  }

  try {
    return await inflight
  } finally {
    inflight = null
  }
}

async function fetchDiscoveryConfig() {
  const clientId = config.get('entraId.clientId')
  const clientSecret = config.get('entraId.clientSecret')
  const wellKnown = config.get('entraId.oidcWellKnownConfigurationUrl')

  const openIdConfig = await openid.discovery(
    new URL(wellKnown),
    clientId,
    clientSecret
  )

  cachedDiscovery = openIdConfig
  cachedAt = Date.now()

  return openIdConfig
}

async function refreshTokens(jwtRefreshToken) {
  const openIdConfig = await getDiscoveryConfig()
  const scope = getScopesForAuth().join(' ')

  return openid.refreshTokenGrant(openIdConfig, jwtRefreshToken, {
    scope
  })
}

export { refreshTokens }
