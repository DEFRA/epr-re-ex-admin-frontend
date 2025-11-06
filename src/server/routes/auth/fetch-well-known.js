import { fetchJson } from './fetch-json.js'
import { config } from '../../../config/config.js'

async function fetchWellKnown(endpoint) {
  const { payload } = await fetchJson(endpoint)
  return payload ?? {}
}

async function fetchDefraIdWellKnown() {
  return fetchWellKnown(config.get('oidc.defraId.wellKnownUrl'))
}

async function fetchEntraIdWellKnown() {
  return fetchWellKnown(config.get('oidc.azureAD.wellKnownUrl'))
}

export { fetchDefraIdWellKnown, fetchEntraIdWellKnown }
