import { getSafeRedirect } from '../../../common/helpers/auth/get-safe-redirect.js'
import { verifyToken } from '../../../common/helpers/auth/verify-token.js'

export default {
  method: 'GET',
  path: '/auth/sign-in-oidc',
  options: {
    auth: { strategy: 'entra-id', mode: 'try' }
  },
  handler: async function (request, h) {
    // If the user is not authenticated, redirect to the home page
    // This should only occur if the user tries to access the sign-in page directly and not part of the sign-in flow
    // eg if the user has bookmarked the Defra Identity sign-in page or they have signed out and tried to go back in the browser
    if (!request.auth.isAuthenticated) {
      return h.view('unauthorised')
    }

    // TO-DO This is where we will also extract the refresh token, when we handle that flow
    const { profile, token } = request.auth.credentials

    // TO-DO: Double check this implemention
    await verifyToken(token)

    // TO-DO: This is where we should check for permissions

    // Create a new session using cookie authentication strategy which is used for all subsequent requests
    request.cookieAuth.set({ sessionId: profile.sessionId })

    // Redirect user to the page they were trying to access before signing in or to the home page if no redirect was set
    const redirect = request.yar.get('redirect') ?? '/home'
    request.yar.clear('redirect')
    // Ensure redirect is a relative path to prevent redirect attacks
    const safeRedirect = getSafeRedirect(redirect)
    return h.redirect(safeRedirect)
  }
}
