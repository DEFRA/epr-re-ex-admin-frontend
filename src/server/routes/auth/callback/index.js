import { createUserSession } from '#server/common/helpers/auth/create-user-session.js'
import { fetchJsonFromBackend } from '#server/common/helpers/fetch-json-from-backend.js'
import { randomUUID } from 'node:crypto'
import { auditSignIn } from '#server/common/helpers/auditing/index.js'
import { metrics } from '#server/common/helpers/metrics/index.js'

export default {
  method: 'GET',
  path: '/auth/callback',
  options: {
    auth: { strategy: 'entra-id', mode: 'try' }
  },
  handler: async function (request, h) {
    if (request.auth.error) {
      request.logger.error('Sign-in failed')
      await metrics.signInFailure()
    }

    if (!request.auth.isAuthenticated) {
      return h.view('unauthorised')
    }

    const { profile, token, refreshToken } = request.auth.credentials

    const { displayName = '', id: userId, email, loginHint } = profile

    const sessionId = randomUUID()

    const userSession = {
      sessionId,
      userId,
      displayName,
      email,
      loginHint,
      isAuthenticated: true,
      token,
      refreshToken,
      scope: []
    }
    await createUserSession(request, userSession)

    let scope = []
    try {
      const data = await fetchJsonFromBackend(request, '/v1/me/scope')
      scope = data.scope ?? []
    } catch (error) {
      request.logger.error(
        { error: error.message },
        'Failed to fetch user scope from backend'
      )
    }

    await createUserSession(request, { ...userSession, scope })

    const redirect = request.yar?.flash('referrer')?.at(0) ?? '/'

    const safeRedirect = getSafeRedirect(redirect)

    request.logger.info({ userId, displayName }, 'User signed in')
    auditSignIn({ ...userSession, scope })
    await metrics.signInSuccess()

    request.logger.info(`Sign-in complete, redirecting user to ${safeRedirect}`)
    return h.redirect(safeRedirect)
  }
}

function getSafeRedirect(redirect) {
  return !redirect?.startsWith('/') || redirect.startsWith('//')
    ? '/'
    : redirect
}
