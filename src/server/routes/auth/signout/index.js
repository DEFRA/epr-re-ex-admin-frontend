import { config } from '#config/config.js'
import { clearUserSession } from '#server/common/helpers/auth/clear-user-session.js'
import { getOidcConfig } from '#server/common/helpers/auth/get-oidc-config.js'

export default {
  method: 'GET',
  path: '/auth/signout',
  handler: async (request, h) => {
    if (!request.auth.isAuthenticated) {
      // User is already signed-out
      return h.redirect('/')
    }

    clearUserSession(request)

    const { end_session_endpoint: entraLogoutUrl } = await getOidcConfig()

    const logoutUrl = encodeURI(
      `${entraLogoutUrl}?post_logout_redirect_uri=${config.get('appBaseUrl')}/`
    )

    return h.redirect(logoutUrl)
  }
}
