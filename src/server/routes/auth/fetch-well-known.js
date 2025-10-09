import { fetchJson } from './fetch-json.js'
import { config } from '../../../config/config.js'

export async function fetchWellknown() {
  const endpoint = config.get('oidc.azureAD.wellKnownUrl')

  const { payload } = await fetchJson(endpoint)
  return payload ?? {}
}
