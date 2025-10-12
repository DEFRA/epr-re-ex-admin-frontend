import { createUserSession } from '#server/common/helpers/auth/create-user-session.js'
import { randomUUID } from 'node:crypto'

export default {
  method: 'GET',
  path: '/auth/callback',
  options: {
    // TO-DO: Should we fail like in Will's PoC?
    auth: { strategy: 'entra-id', mode: 'try' }
  },
  handler: async function (request, h) {
    if (!request.auth.isAuthenticated) {
      return h.view('unauthorised')
    }

    const { profile, token } = request.auth.credentials

    // TO-DO: Token verification works differently than in Defra Id and needs more work
    // This is left for a future PR
    // await verifyToken(token)

    // TO-DO: `id` , `email` or `loginHint` are missing in the `profile` object we receive from DefraDev at the moment
    const { displayName } = profile

    // TO-DO: Here we can extract decide the user role based on their profile info

    // TO-DO: Is this a good the approach to take
    const sessionId = randomUUID()

    // TO-DO: DO we need to set some expiration on the session like CDP does?
    const userSession = {
      sessionId,
      displayName,
      isAuthenticated: request.auth.isAuthenticated,
      token,
      refreshToken: request.auth.credentials.refreshToken
    }

    await createUserSession(request, userSession)

    // TO-DO:: We should redirect the user to their original destination
    return h.redirect('/')
  }
}
