import { fetchJson } from './fetch-json.js'
import { config } from '../../../config/config.js'

async function fetchWellKnown(endpoint) {
  const { payload } = await fetchJson(endpoint)
  return payload ?? {}
}

async function fetchDefraIdWellKnown() {
  const url = `${config.get('oidc.defraId.wellKnownUrl')}?p=${config.get('oidc.defraId.policy')}`
  return fetchWellKnown(url)
}

async function fetchEntraIdWellKnown() {
  return fetchWellKnown(config.get('oidc.azureAD.wellKnownUrl'))
}

export { fetchDefraIdWellKnown, fetchEntraIdWellKnown }
