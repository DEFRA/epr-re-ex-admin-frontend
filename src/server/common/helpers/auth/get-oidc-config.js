import Wreck from '@hapi/wreck'
import { config } from '#config/config.js'

const ONE_HOUR_MS = 60 * 60 * 1000

let cachedConfig = null
let cachedAt = 0
let inflight = null

async function getOidcConfig() {
  if (cachedConfig && Date.now() - cachedAt < ONE_HOUR_MS) {
    return cachedConfig
  }

  // Coalesce concurrent calls into a single fetch. The shared promise
  // means all awaiters receive the same resolved value (or rejection).
  // Clearing inflight in finally is safe — it's idempotent and by that
  // point the result is already cached (or the error already propagated).
  if (!inflight) {
    inflight = fetchOidcConfig()
  }

  try {
    return await inflight
  } finally {
    inflight = null
  }
}

// Uses Wreck deliberately — this shares the same proxy code path as
// @hapi/bell's OAuth token exchange (Wreck → private https.Agent →
// global-agent). Fetching at startup makes this a canary: if the proxy
// is misconfigured, the server fails to start rather than starting in a
// silently broken state where users cannot log in.
async function fetchOidcConfig() {
  const { payload } = await Wreck.get(
    config.get('entraId.oidcWellKnownConfigurationUrl'),
    {
      json: true
    }
  )

  cachedConfig = payload
  cachedAt = Date.now()

  return payload
}

export { getOidcConfig }
