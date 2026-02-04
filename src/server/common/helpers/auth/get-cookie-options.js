import { config } from '#config/config.js'
import { getUserSession } from './get-user-session.js'
import { validateAndRefreshSession } from './validate-and-refresh-session.js'

export function getCookieOptions() {
  return {
    cookie: {
      password: config.get('session.cookie.password'),
      path: '/',
      isSecure: config.get('isProduction'),
      ttl: config.get('session.cookie.ttl'),
      isSameSite: 'Lax',
      clearInvalid: true
    },
    keepAlive: true,
    redirectTo: false,
    validate: async function (request) {
      const userSession = await getUserSession(request)

      if (!userSession) {
        return { isValid: false }
      }

      try {
        const validatedSession = await validateAndRefreshSession(
          request,
          userSession
        )
        return { isValid: true, credentials: validatedSession }
      } catch {
        return { isValid: false }
      }
    }
  }
}

export { validateAndRefreshSession }
