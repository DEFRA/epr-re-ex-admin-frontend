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

async function fetchOidcConfig() {
  const url = config.get('entraId.oidcWellKnownConfigurationUrl')
  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`OIDC config fetch failed: ${res.status} ${res.statusText}`)
  }

  cachedConfig = await res.json()
  cachedAt = Date.now()

  return cachedConfig
}

export { getOidcConfig }
