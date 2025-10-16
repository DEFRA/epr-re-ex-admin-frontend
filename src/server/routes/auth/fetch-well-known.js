import { fetchJson } from './fetch-json.js'

export async function fetchWellknown(endpoint) {
  const { payload } = await fetchJson(endpoint)
  return payload ?? {}
}
