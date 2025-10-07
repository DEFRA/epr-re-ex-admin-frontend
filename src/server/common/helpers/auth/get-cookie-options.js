import config from '../../../../config/config.js'

export function getCookieOptions() {
  return {
    cookie: {
      password: config.get('cookie.password'),
      path: '/',
      isSecure: config.get('isProd'),
      isSameSite: 'Lax'
    },
    redirectTo: function (request) {
      return `/sign-in?redirect=${request.url.pathname}${request.url.search}`
    },
    validate: async function (request, session) {
      const userSession = await request.server.app.cache.get(session.sessionId)

      // If session does not exist, return an invalid session
      if (!userSession) {
        return { isValid: false }
      }

      // TO-DO: Verify Defra Identity token has not expired

      // Set the user's details on the request object and allow the request to continue
      // Depending on the service, additional checks can be performed here before returning `isValid: true`
      return { isValid: true, credentials: userSession }
    }
  }
}
