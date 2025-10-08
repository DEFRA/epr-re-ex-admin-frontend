import { verifyToken } from '../../../common/helpers/auth/verify-token.js'
import { createUserSession } from '../../../common/helpers/auth/create-user-session.js'

export default {
  method: 'GET',
  path: '/auth/signin-oidc',
  options: {
    // TO-DO: Should we fail like in Will's PoC?
    auth: { strategy: 'entra-id', mode: 'try' }
  },
  handler: async function (request, h) {
    if (!request.auth.isAuthenticated) {
      return h.view('unauthorised')
    }

    const { profile, token } = request.auth.credentials

    await verifyToken(token)

    const userSession = {
      id: profile.id,
      email: profile.email,
      displayName: profile.displayName,
      isAuthenticated: true,
      token
    }

    // TO-DO: Is a sessionId really available in the profile
    await createUserSession(request, profile.sessionId, userSession)

    request.cookieAuth.set({ sessionId: profile.sessionId })

    // TO-DO:: We should redirect the user to their original destination
    return h.redirect('/')
  }
}
