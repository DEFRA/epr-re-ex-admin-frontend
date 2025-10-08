import { config } from '../../../../config/config.js'
import { clearUserSession } from '../../../../server/common/helpers/auth/clear-user-session.js'

export default [
  {
    method: 'GET',
    path: '/auth/signout',
    options: {
      auth: false
    },
    handler: async (request, h) => {
      // TO-DO: Alternatively, we could check if getUserSession returns a session
      if (!request.auth.isAuthenticated) {
        // User is already signed-out
        return h.redirect('/')
      }

      // TO-DO: Review this and compare with other solutions,
      // The logout flow is also prone to attacks and we check all possible vectors
      clearUserSession(request)

      request.cookieAuth.clear()

      const { end_session_endpoint: entraLogoutUrl } = await fetchWellknown()

      const logoutUrl = encodeURI(
        `${entraLogoutUrl}?post_logout_redirect_uri=${config.get('appBaseUrl')}/`
      )

      return h.redirect(logoutUrl)
    }
  }
]
