/**
 * Get CSRF token for testing
 * @param {Server} server - Hapi server instance
 * @param {string} getUrl - URL to GET to obtain CSRF token
 * @param {Object} [auth] - Optional auth credentials for authenticated requests
 * @returns {Promise<{cookie: string, crumb: string}>}
 */
export async function getCsrfToken(server, getUrl, auth) {
  const requestOptions = { method: 'GET', url: getUrl }
  if (auth) {
    requestOptions.auth = auth
  }
  const response = await server.inject(requestOptions)
  const setCookie = response.headers['set-cookie']
  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie]
  const crumbCookie = cookies.find(
    (cookie) => cookie && cookie.startsWith('crumb=')
  )
  if (!crumbCookie) throw new Error('No crumb cookie found')
  const crumbValue = crumbCookie.split(';')[0].split('=')[1]
  // Preserve all cookies from the response (e.g., session + crumb)
  // to accurately represent multi-cookie scenarios in tests
  const cookieHeader = cookies
    .filter((c) => c)
    .map((c) => c.split(';')[0])
    .join('; ')
  return { cookie: cookieHeader, crumb: crumbValue }
}

/**
 * @import { Server } from '@hapi/hapi'
 */
