import { config } from '../../../../config/config.js'
import { clearUserSession } from '../../../../server/common/helpers/auth/clear-user-session.js'
import { getOidcConfig } from '../../../common/helpers/auth/get-oidc-config.js'

export default {
  method: 'GET',
  path: '/auth/signout',
  handler: async (request, h) => {
    // TO-DO: Alternatively, we could check if getUserSession returns a session
    if (!request.auth.isAuthenticated) {
      // User is already signed-out
      return h.redirect('/')
    }

    // TO-DO: Review this and compare with other solutions,
    // The logout flow is also prone to attacks and we check all possible vectors
    clearUserSession(request)

    const { end_session_endpoint: entraLogoutUrl } = await getOidcConfig()

    // TO-DO: We may want to look into using the `login_hint` parameter to
    // prevent the user from having to select their account again
    // https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-protocols-oidc#send-a-sign-out-request
    const logoutUrl = encodeURI(
      `${entraLogoutUrl}?post_logout_redirect_uri=${config.get('appBaseUrl')}/`
    )

    return h.redirect(logoutUrl)
  }
}
