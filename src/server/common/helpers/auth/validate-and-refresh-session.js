import { createUserSession } from './create-user-session.js'
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

export { validateAndRefreshSession }
