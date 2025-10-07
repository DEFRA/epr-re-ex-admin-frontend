import Jwt from '@hapi/jwt'
import { getOidcConfig } from '../common/helpers/auth/get-oidc-config.js'
import { getSafeRedirect } from '../common/helpers/get-safe-redirect.js'
import config from '../config/index.js'

export default {
  plugin: {
    name: 'auth',
    register: async (server) => {
      const oidcConfig = await getOidcConfig()

      // Bell is a third-party plugin that provides a common interface for OAuth 2.0 authentication
      // Used to authenticate users with Defra Identity and a pre-requisite for the Cookie authentication strategy
      // Also used for changing organisations and signing out
      server.auth.strategy('entra-id', 'bell', getBellOptions(oidcConfig))

      // Cookie is a built-in authentication strategy for hapi.js that authenticates users based on a session cookie
      // Used for all non-Defra Identity routes
      // Lax policy required to allow redirection after Defra Identity sign out
      server.auth.strategy('session', 'cookie', getCookieOptions())

      // Set the default authentication strategy to session
      // All routes will require authentication unless explicitly set to 'entra-id' or `auth: false`
      server.auth.default('session')
    }
  }
}

function getBellOptions(oidcConfig) {
  return {
    provider: {
      name: 'entra-id',
      protocol: 'oauth2',
      useParamsAuth: true,
      auth: oidcConfig.authorization_endpoint,
      token: oidcConfig.token_endpoint,
      scope: ['openid', 'offline_access', config.get('entraId.clientId')],
      profile: function (credentials, _params, _get) {
        const payload = Jwt.token.decode(credentials.token).decoded.payload

        // Map all JWT properties to the credentials object so it can be stored in the session
        // Add some additional properties to the profile object for convenience
        credentials.profile = {
          ...payload,
          crn: payload.contactId,
          name: `${payload.firstName} ${payload.lastName}`,
          organisationId: payload.currentRelationshipId
        }
      }
    },
    clientId: config.get('entraId.clientId'),
    clientSecret: config.get('entraId.clientSecret'),
    password: config.get('cookie.password'),
    isSecure: config.get('isProd'),
    location: function (request) {
      // If request includes a redirect query parameter, store it in the session to allow redirection after authentication
      if (request.query.redirect) {
        // Ensure redirect is a relative path to prevent redirect attacks
        const safeRedirect = getSafeRedirect(request.query.redirect)
        request.yar.set('redirect', safeRedirect)
      }

      return config.get('defraId.redirectUrl')
    },
    providerParams: function (request) {
      const params = {
        serviceId: config.get('entraId.serviceId'),
        p: config.get('entraId.policy'),
        response_mode: 'query'
      }

      // If user intends to switch organisation, force Defra Identity to display the organisation selection screen
      if (request.path === '/auth/organisation') {
        params.forceReselection = true
        // If user has already selected an organisation in another service, pass the organisation Id to force Defra Id to skip the organisation selection screen
        if (request.query.organisationId) {
          params.relationshipId = request.query.organisationId
        }
      }

      return params
    }
  }
}

function getCookieOptions() {
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

export { getBellOptions, getCookieOptions }
