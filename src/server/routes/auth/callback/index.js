import { createUserSession } from '#server/common/helpers/auth/create-user-session.js'
import { randomUUID } from 'node:crypto'

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

    const { profile, token } = request.auth.credentials

    const { displayName = '' } = profile

    const sessionId = randomUUID()

    const userSession = {
      sessionId,
      displayName,
      isAuthenticated: request.auth.isAuthenticated,
      token,
      refreshToken: request.auth.credentials.refreshToken
    }

    await createUserSession(request, userSession)

    return h.redirect('/')
  }
}
