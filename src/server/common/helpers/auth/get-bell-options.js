import Jwt from '@hapi/jwt'
import { getSafeRedirect } from './get-safe-redirect.js'
import config from '../../../../config/config.js'

export function getBellOptions(oidcConfig) {
  return {
    provider: {
      name: 'entra-id',
      protocol: 'oauth2',
      useParamsAuth: true,
      auth: oidcConfig.authorization_endpoint,
      token: oidcConfig.token_endpoint,
      scope: ['openid', 'profile', 'email'],
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

      return config.get('entraId.redirectUrl')
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
