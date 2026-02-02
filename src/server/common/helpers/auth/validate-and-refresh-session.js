import { createUserSession } from './create-user-session.js'
import { refreshTokens } from './refresh-tokens.js'
import Jwt from '@hapi/jwt'

const BACKEND_MAX_AGE_SEC = 3600
const REFRESH_BUFFER_SEC = 300

function isTokenApproachingMaxAge(decoded) {
  const payload = decoded?.payload
  if (!payload?.iat) {
    return false
  }
  const nowSec = Math.floor(Date.now() / 1000)
  const tokenAgeSec = nowSec - payload.iat
  const threshold = BACKEND_MAX_AGE_SEC - REFRESH_BUFFER_SEC
  return tokenAgeSec > threshold
}

async function validateAndRefreshSession(request, userSession) {
  try {
    const decoded = Jwt.token.decode(userSession.token)
    Jwt.token.verifyTime(decoded, { timeSkewSec: 60 })

    if (isTokenApproachingMaxAge(decoded)) {
      throw new Error('Token approaching max age')
    }

    return userSession
  } catch {
    if (!userSession.refreshToken) {
      throw new Error('Session expired and no refresh token available')
    }

    const { access_token: token, refresh_token: refreshToken } =
      await refreshTokens(userSession.refreshToken)

    const updatedSession = { ...userSession, token, refreshToken }
    await createUserSession(request, updatedSession)
    return updatedSession
  }
}

export { validateAndRefreshSession }
