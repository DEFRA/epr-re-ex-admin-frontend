import { createUserSession } from '#server/common/helpers/auth/create-user-session.js'
import { randomUUID } from 'node:crypto'
import { verifyToken } from '#server/common/helpers/auth/verify-token.js'

export default {
  method: 'GET',
  path: '/auth/callback',
  options: {
    auth: { strategy: 'entra-id', mode: 'try' }
  },
  handler: async function (request, h) {
    if (!request.auth.isAuthenticated) {
      return h.view('unauthorised')
    }

    const { profile, token, refreshToken } = request.auth.credentials

    await verifyToken(token)

    const { displayName = '' } = profile

    const sessionId = randomUUID()

    const userSession = {
      sessionId,
      displayName,
      isAuthenticated: true,
      token,
      refreshToken
    }

    await createUserSession(request, userSession)

    return h.redirect('/')
  }
}
