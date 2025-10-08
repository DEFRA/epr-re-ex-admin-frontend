import { getSafeRedirect } from '../../../common/helpers/auth/get-safe-redirect.js'
import { verifyToken } from '../../../common/helpers/auth/verify-token.js'

export default {
  method: 'GET',
  path: '/auth/signin-oidc',
  options: {
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

    await request.server.app.cache.set(profile.sessionId, userSession)

    request.cookieAuth.set({ sessionId: profile.sessionId })

    const redirect = request.yar.get('redirect') ?? '/'
    request.yar.clear('redirect')
    const safeRedirect = getSafeRedirect(redirect)
    return h.redirect(safeRedirect)
  }
}
