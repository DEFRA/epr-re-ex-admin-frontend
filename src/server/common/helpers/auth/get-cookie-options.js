import { config } from '#config/config.js'
import { createUserSession } from './create-user-session.js'
import { getUserSession } from './get-user-session.js'
import { refreshTokens } from './refresh-tokens.js'
import Jwt from '@hapi/jwt'

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

      // Verify auth token has not expired
      try {
        const decoded = Jwt.token.decode(userSession.token)
        // Allow 60 second tolerance for clock skew between servers
        Jwt.token.verifyTime(decoded, { timeSkewSec: 60 })
      } catch {
        const { access_token: token, refresh_token: refreshToken } =
          await refreshTokens(userSession.refreshToken)
        userSession.token = token
        userSession.refreshToken = refreshToken

        await createUserSession(userSession.sessionId, userSession)
      }

      return { isValid: true, credentials: userSession }
    }
  }
}
