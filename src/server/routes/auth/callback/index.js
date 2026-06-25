import { createUserSession } from '#server/common/helpers/auth/create-user-session.js'
import { fetchAdminMe } from '#server/common/helpers/auth/fetch-admin-me.js'
import { randomUUID } from 'node:crypto'
import { statusCodes } from '#server/common/constants/status-codes.js'
import { auditSignIn } from '#server/common/helpers/auditing/index.js'
import { loggingEventActions } from '#server/common/enums/event.js'

/**
 * @import { HapiRequest } from '#server/common/hapi-types.js'
 *
 * @typedef {{
 *   profile: { id: string, email: string, displayName?: string, loginHint?: string },
 *   token: string,
 *   refreshToken: string
 * }} BellCredentials
 */

export default {
  method: 'GET',
  path: '/auth/callback',
  options: {
    auth: { strategy: 'entra-id', mode: 'try' }
  },
  /** @param {HapiRequest} request */
  handler: async function (request, h) {
    if (request.auth.error) {
      request.logger.error({ message: 'Sign-in failed' })
      await request.metrics.counter('signInFailure')
    }

    if (!request.auth.isAuthenticated) {
      return h.view('unauthorised')
    }

    const { profile, token, refreshToken } = /** @type {BellCredentials} */ (
      /** @type {unknown} */ (request.auth.credentials)
    )

    const { displayName = '', id: userId, email, loginHint } = profile

    let scopes = []
    try {
      const adminMe = await fetchAdminMe(token)
      scopes = adminMe.scopes
    } catch (error) {
      const statusCode = /** @type {{ statusCode?: number }} */ (error)
        .statusCode
      if (statusCode === statusCodes.forbidden) {
        request.logger.info({
          message: `Sign-in denied: user ${email} has no admin tier`,
          event: { action: loggingEventActions.signIn, reason: 'no_admin_tier' }
        })
        await request.metrics.counter('signInFailure')
        return h.view('unauthorised')
      }
      request.logger.error({
        err: error,
        message: 'Failed to resolve admin scopes from backend'
      })
      await request.metrics.counter('signInFailure')
      throw error
    }

    const sessionId = randomUUID()

    const userSession = {
      sessionId,
      userId,
      displayName,
      email,
      loginHint,
      isAuthenticated: true,
      scopes,
      token,
      refreshToken
    }
    await createUserSession(request, userSession)

    const redirect = request.yar?.flash('referrer')?.at(0) ?? '/'

    const safeRedirect = getSafeRedirect(redirect)

    request.logger.info({
      message: 'User signed in',
      event: {
        action: loggingEventActions.signIn,
        reason: `userId=${userId} displayName=${displayName}`
      }
    })
    auditSignIn(userSession)
    await request.metrics.counter('signInSuccess')

    request.logger.info({
      message: `Sign-in complete, redirecting user to ${safeRedirect}`
    })
    return h.redirect(safeRedirect)
  }
}

function getSafeRedirect(redirect) {
  return !redirect?.startsWith('/') || redirect.startsWith('//')
    ? '/'
    : redirect
}
