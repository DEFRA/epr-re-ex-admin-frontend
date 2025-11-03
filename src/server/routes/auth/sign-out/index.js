import { config } from '#config/config.js'
import { clearUserSession } from '#server/common/helpers/auth/clear-user-session.js'
import { getOidcConfig } from '#server/common/helpers/auth/get-oidc-config.js'
import { getUserSession } from '#server/common/helpers/auth/get-user-session.js'

export default {
  method: 'GET',
  path: '/auth/sign-out',
  handler: async (request, h) => {
    const userSession = await getUserSession(request)

    if (!userSession) {
      return h.redirect('/')
    }

    const { end_session_endpoint: entraLogoutUrl } = await getOidcConfig()

    const logoutUrl = encodeURI(
      `${entraLogoutUrl}?post_logout_redirect_uri=${config.get('appBaseUrl')}/`
    )

    clearUserSession(request)

    return h.redirect(logoutUrl)
  }
}
