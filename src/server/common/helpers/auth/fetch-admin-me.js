import { config } from '#config/config.js'

/**
 * @typedef {{ scopes: string[] }} AdminMeResponse
 */

/**
 * Calls the backend `GET /v1/admin/me` endpoint with an explicit Entra access
 * token. Used during the post-Bell sign-in flow and the refresh-token flow,
 * before a user session exists (so we cannot route through fetch-json-from-backend
 * which reads the token from the session).
 *
 * Returns the resolved admin scope bundle. Throws on non-200 — callers decide
 * whether a 403 means "no admin tier" or something more serious (an Entra
 * outage etc.).
 *
 * @param {string} accessToken - Entra ID access token
 * @returns {Promise<AdminMeResponse>}
 */
export async function fetchAdminMe(accessToken) {
  const eprBackendUrl = config.get('eprBackendUrl')
  const url = `${eprBackendUrl}/v1/admin/me`

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw Object.assign(
      new Error(
        `GET /v1/admin/me failed: ${response.status} ${response.statusText}`
      ),
      { statusCode: response.status }
    )
  }

  return await response.json()
}
