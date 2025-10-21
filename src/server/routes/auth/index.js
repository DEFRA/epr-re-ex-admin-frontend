import Boom from '@hapi/boom'
import bell from '@hapi/bell'
import cookie from '@hapi/cookie'
import jwt from '@hapi/jwt'
import { fetchWellknown } from './fetch-well-known.js'
import { config } from '../../../config/config.js'
import escape from 'lodash/escape.js'
import { randomUUID } from 'node:crypto'
import Wreck from '@hapi/wreck'
import jwkToPem from 'jwk-to-pem'

const signInStrategy = 'aad'
// const signInStrategy = 'defra-id'

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
    server.auth.strategy('defra-id', 'bell', await defraIdBellOptions())
    server.auth.strategy('session', 'cookie', await cookieOptions())

    server.route([
      {
        method: 'GET',
        path: '/auth/callback',
        options: {
          auth: 'aad',
          response: {
            failAction: () => Boom.boomify(Boom.unauthorized())
          }
        },
        handler: async function GET(request, h) {
          const sessionId = randomUUID()

          const { profile, refreshToken, token, expiresIn } =
            request.auth.credentials

          await verifyToken(
            token,
            (await fetchWellknown(config.get('oidc.azureAD.wellKnownUrl')))
              .jwks_uri
          )

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
        }
      },
      {
        method: 'GET',
        path: '/auth/sign-in-oidc',
        options: {
          auth: 'defra-id',
          response: {
            failAction: () => Boom.boomify(Boom.unauthorized())
          }
        },
        handler: async function GET(request, h) {
          const sessionId = randomUUID()

          const { profile, refreshToken, token, expiresIn } =
            request.auth.credentials

          await verifyToken(
            token,
            (await fetchWellknown(config.get('oidc.defraId.wellKnownUrl')))
              .jwks_uri
          )

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
        }
      },
      {
        method: 'GET',
        path: '/auth/login',
        handler(_request, h) {
          return h.redirect('/')
        },
        options: {
          auth: signInStrategy
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

          const wellKnownUrl = {
            aad: config.get('oidc.azureAD.wellKnownUrl'),
            'defra-id': config.get('oidc.defraId.wellKnownUrl')
          }[signInStrategy]

          const { end_session_endpoint: aadLogoutUrl } =
            await fetchWellknown(wellKnownUrl)

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
  } = await fetchWellknown(config.get('oidc.azureAD.wellKnownUrl'))

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
      scope: [
        'openid',
        'profile',
        'email',
        /*
         * offline_access scope needed to make Entra ID return refresh token during token exchange
         */
        'offline_access',
        /*
         * api://... scope needed to make the aud in the returned token be the service's clientId
         * (without this Entra ID returns a token where the audience is Microsoft Graph API)
         */
        `api://${config.get('oidc.azureAD.clientId')}/.default`
      ],
      profile: async function (credentials, _params, get) {
        const decodedPayload = jwt.token.decode(credentials.token).decoded
          .payload

        credentials.profile = {
          id: decodedPayload.oid,
          displayName: decodedPayload.name,
          email: decodedPayload.upn ?? decodedPayload.preferred_username
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

async function defraIdBellOptions() {
  const {
    authorization_endpoint: aadAuthEndpoint,
    token_endpoint: aadTokenEndpoint
  } = await fetchWellknown(config.get('oidc.defraId.wellKnownUrl'))

  return {
    provider: {
      name: 'defra-id',
      protocol: 'oauth2',
      useParamsAuth: true,
      auth: aadAuthEndpoint,
      token: aadTokenEndpoint,
      scope: ['openid', 'offline_access', config.get('oidc.defraId.clientId')],
      profile: function (credentials, _params, _get) {
        const decodedPayload = jwt.token.decode(credentials.token).decoded
          .payload

        // note decodedPayload parsed differently for AAD vs Defra ID token
        credentials.profile = {
          id: decodedPayload.contactId,
          displayName: `${decodedPayload.firstName} ${decodedPayload.lastName}`,
          email: decodedPayload.email
        }
      }
    },
    clientId: config.get('oidc.defraId.clientId'),
    clientSecret: config.get('oidc.defraId.clientSecret'),
    password: config.get('session.cookie.password'),
    isSecure: config.get('session.cookie.secure'),
    ttl: config.get('session.cookie.ttl'),
    location: function (request) {
      // has to be port 3000 to match whats configured in Defra ID for this client
      return `${config.get('appBaseUrl')}/auth/sign-in-oidc`
    },
    providerParams: function (request) {
      const params = {
        serviceId: config.get('oidc.defraId.serviceId'),
        p: config.get('oidc.defraId.policy'),
        response_mode: 'query'
      }
      return params
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
    await request.server.app.cache.drop(sessionId)
  }
}

async function verifyToken(token, jwksUri) {
  const { payload } = await Wreck.get(jwksUri, {
    json: true
  })
  const { keys } = payload

  const decoded = jwt.token.decode(token)

  const key = keys.find((k) => k.kid === decoded.decoded.header.kid)

  // Convert the JSON Web Key (JWK) to a PEM-encoded public key so that it can be used to verify the token
  const pem = jwkToPem(key)

  // Verify the (decoded) token is signed with the appropriate key by verifying the signature using the public key
  jwt.token.verify(decoded, { key: pem, algorithm: 'RS256' })
}
