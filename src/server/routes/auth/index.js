import Boom from '@hapi/boom'
import bell from '@hapi/bell'
import cookie from '@hapi/cookie'
import jwt from '@hapi/jwt'
import { fetchWellknown } from './fetch-well-known.js'
import { config } from '../../../config/config.js'
import escape from 'lodash/escape.js'
import { randomUUID } from 'node:crypto'

export default {
  name: 'auth',
  async register(server) {
    // TODO confirm understanding of why this is needed/how it compliments or co-exists with the (yar) plugin in session-cache.js
    server.app.cache = server.cache({
      cache: config.get('session.cache.name'),
      segment: 'session', // TODO needed? From config? (lifted from FCP example)
      expiresIn: config.get('session.cache.ttl')
    })

    await server.register([bell, cookie])

    server.auth.strategy('aad', 'bell', await aadBellOptions())
    server.auth.strategy('session', 'cookie', await cookieOptions())

    server.route([
      {
        method: 'GET',
        path: '/auth/callback',
        handler: async function GET(request, h) {
          const sessionId = randomUUID()

          const { profile, refreshToken, token, expiresIn } =
            request.auth.credentials
          // TODO verify token (see FCP example)

          // Store token and all useful data in the session cache
          await createUserSession(request, sessionId, {
            isAuthenticated: true,
            id: profile.id,
            email: profile.email,
            displayName: profile.displayName,
            scope: profile.scope,
            token,
            refreshToken,
            expiresIn
          })

          // store session ID in cookie
          // from fcp example - the request is automagically decorated with cookieAuth by @hapi/cookie (see https://hapi.dev/module/cookie/api/?v=12.0.1)
          request.cookieAuth.set({ sessionId })

          // TODO redirect to page user originally tried to access (see FCP example)
          // TODO ensure safe redirect (from FCP example)
          // redirectWithRefresh (from CDP example)
          return h
            .response(
              `<html><head><meta http-equiv="refresh" content="0;URL='${escape('/')}'"></head><body></body></html>`
            )
            .takeover()
        },
        options: {
          auth: 'aad',
          response: {
            failAction: () => Boom.boomify(Boom.unauthorized())
          }
        }
      },
      {
        method: 'GET',
        path: '/auth/login',
        handler(_request, h) {
          return h.redirect('/')
        },
        options: {
          auth: 'aad'
        }
      },
      {
        method: 'GET',
        path: '/auth/logout',
        async handler(request, h) {
          // validateState(request, request.query.state) // TODO (see FCP example)

          clearUserSession(request)

          // clear cookie with session ID
          // from fcp example - the request is automagically decorated with cookieAuth by @hapi/cookie (see https://hapi.dev/module/cookie/api/?v=12.0.1)
          request.cookieAuth.clear()

          const { end_session_endpoint: aadLogoutUrl } = await fetchWellknown()

          const logoutUrl = encodeURI(
            `${aadLogoutUrl}?post_logout_redirect_uri=${config.get('appBaseUrl')}/`
          )

          return h.redirect(logoutUrl)
        }
      }
    ])
  }
}

async function aadBellOptions() {
  const {
    authorization_endpoint: aadAuthEndpoint,
    token_endpoint: aadTokenEndpoint
  } = await fetchWellknown()

  return {
    location: (request) => {
      // TODO understand hapi/yar usage
      // if (request.info.referrer) {
      //   request.yar.flash(sessionNames.referrer, request.info.referrer)
      // }

      return `${config.get('appBaseUrl')}/auth/callback`
    },
    provider: {
      name: 'azure-oidc',
      protocol: 'oauth2',
      useParamsAuth: true,
      auth: aadAuthEndpoint,
      token: aadTokenEndpoint,
      scope: ['openid', 'profile', 'email'],
      profile: async function (credentials, _params, get) {
        const decodedPayload = jwt.token.decode(credentials.token).decoded
          .payload

        credentials.profile = {
          id: decodedPayload.oid,
          displayName: decodedPayload.name,
          email: decodedPayload.upn ?? decodedPayload.preferred_username,
          scope: ['service_maintainer'] // TODO populate this by looking up from config
        }
      }
    },
    clientId: config.get('oidc.azureAD.clientId'),
    forceHttps: config.get('isProduction'),
    clientSecret: config.get('oidc.azureAD.clientSecret'),
    cookie: 'bell-azure-oidc',
    password: config.get('session.cookie.password'),
    isSecure: config.get('session.cookie.secure'),
    ttl: config.get('session.cookie.ttl'),
    config: {
      tenant: config.get('oidc.azureAD.tenantId')
    }
  }
}

// TODO re-visit if/where isSameSite: 'Lax' is used
async function cookieOptions() {
  return {
    cookie: {
      name: 'userSessionCookie',
      password: config.get('session.cookie.password'),
      path: '/',
      isSecure: config.get('session.cookie.secure')
    },
    redirectTo: function (request) {
      return '/auth/login'
    },
    validate: async function (request, session) {
      const userSession = await getUserSession(request)

      if (!userSession) {
        return { isValid: false }
      }

      // TODO check token expiry (& optionally refresh) - see FCP example
      return { isValid: true, credentials: userSession }
    }
  }
}

export async function getUserSession(request) {
  const sessionId = request.state?.userSessionCookie?.sessionId
  return sessionId ? await request.server.app.cache.get(sessionId) : null
}

async function createUserSession(request, sessionId, payload) {
  await request.server.app.cache.set(sessionId, payload)
}

async function clearUserSession(request) {
  const sessionId = request.state?.userSessionCookie?.sessionId
  if (sessionId) {
    // TODO abstract clear user session data in cache
    // Clear the session cache
    await request.server.app.cache.drop(sessionId)
  }
}
