import { config } from '#config/config.js'
import { clearUserSession } from '#server/common/helpers/auth/clear-user-session.js'
import { getOidcConfig } from '#server/common/helpers/auth/get-oidc-config.js'
import { getUserSession } from '#server/common/helpers/auth/get-user-session.js'
import { loggingEventActions } from '#server/common/enums/event.js'
import { metrics } from '#server/common/helpers/metrics/index.js'
import { auditSignOut } from '#server/common/helpers/auditing/index.js'

export default {
  method: 'GET',
  path: '/auth/sign-out',
  handler: async (request, h) => {
    const userSession = await getUserSession(request)

    if (!userSession) {
      return h.redirect('/')
    }

    const { end_session_endpoint: entraLogoutUrl } = await getOidcConfig()

    const logoutHint = userSession.loginHint ?? userSession.email

    const params = new URLSearchParams()
    if (logoutHint) {
      params.set('logout_hint', logoutHint)
    }
    params.set('post_logout_redirect_uri', `${config.get('appBaseUrl')}/`)

    const logoutUrl = `${entraLogoutUrl}?${params.toString()}`

    await clearUserSession(request)

    request.logger.info({
      message: 'User signed out',
      event: {
        action: loggingEventActions.signOut,
        reason: `userId=${userSession.userId} displayName=${userSession.displayName}`
      }
    })
    auditSignOut(userSession)
    await metrics.signOutSuccess()

    return h.view('routes/auth/sign-out/index', {
      pageTitle: 'Signing out',
      logoutUrl
    })
  }
}
