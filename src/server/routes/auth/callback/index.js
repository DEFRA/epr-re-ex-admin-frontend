import { createUserSession } from '#server/common/helpers/auth/create-user-session.js'
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
      await metrics.signInFailure()
    }

    if (!request.auth.isAuthenticated) {
      return h.view('unauthorised')
    }

    const { profile, token, refreshToken } = request.auth.credentials

    const { displayName = '', id: userId, email } = profile

    const sessionId = randomUUID()

    const userSession = {
      sessionId,
      userId,
      displayName,
      email,
      isAuthenticated: true,
      token,
      refreshToken
    }
    await createUserSession(request, userSession)

    const redirect = request.yar?.flash('referrer')?.at(0) ?? '/'

    const safeRedirect = getSafeRedirect(redirect)

    auditSignIn(userSession)
    await metrics.signInSuccess()
    return h.redirect(safeRedirect)
  }
}

function getSafeRedirect(redirect) {
  return !redirect?.startsWith('/') || redirect.startsWith('//')
    ? '/'
    : redirect
}
