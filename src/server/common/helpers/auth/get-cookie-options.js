import { config } from '#config/config.js'
import { createUserSession } from './create-user-session.js'
import { getUserSession } from './get-user-session.js'
import { refreshTokens } from './refresh-tokens.js'
import Jwt from '@hapi/jwt'

async function validateAndRefreshSession(userSession) {
  try {
    const decoded = Jwt.token.decode(userSession.token)
    // Allow 60 second tolerance for clock skew between servers
    Jwt.token.verifyTime(decoded, { timeSkewSec: 60 })
    return userSession
  } catch {
    const { access_token: token, refresh_token: refreshToken } =
      await refreshTokens(userSession.refreshToken)

    const updatedSession = { ...userSession, token, refreshToken }
    await createUserSession(userSession.sessionId, updatedSession)
    return updatedSession
  }
}

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

      const validatedSession = await validateAndRefreshSession(userSession)
      return { isValid: true, credentials: validatedSession }
    }
  }
}

export { validateAndRefreshSession }
