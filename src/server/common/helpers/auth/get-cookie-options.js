import { config } from '../../../../config/config.js'
import { getUserSession } from './get-user-session.js'

export function getCookieOptions() {
  return {
    cookie: {
      password: config.get('session.cookie.password'),
      path: '/',
      isSecure: config.get('isProduction'),
      isSameSite: 'Lax'
    },
    redirectTo: false,
    validate: async function (request) {
      const userSession = await getUserSession(request)

      // If session does not exist, return an invalid session
      if (!userSession) {
        return { isValid: false }
      }

      // TODO: check token expiry (& optionally refresh)
      // We should make sure the token has NOT expired
      return { isValid: true, credentials: userSession }
    }
  }
}
